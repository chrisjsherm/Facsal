define(['global/session', 'services/errorhandler',
    'services/logger', 'plugins/router', 'durandal/system'],
    function (session, errorhandler, logger, router, system) {

        var unitofwork = session.unitofwork();

        var vm = {
            activate: activate,
            canDeactivate: canDeactivate,
            deactivate: deactivate,

            assignmentVMs: ko.observableArray(),
            columnLength: ko.observable(4),
            selectedDepartmentId: ko.observable(),
            units: ko.observableArray(),
            user: ko.observable(),

            cancelUser: cancelUser,
            saveUser: saveUser,
        };

        vm.selectedDepartmentId.subscribe(function (newValue) {
            if (newValue === '' ||
                newValue === 'Choose...' ||
                newValue === undefined) {
                return vm.assignmentVMs([]);
            }

            var p1 = new breeze.Predicate('name', breeze.FilterQueryOp.Contains, newValue),

                roles = unitofwork.roles.find(p1)
                    .then(function (response) {
                        var roles = response;

                        var assignmentMapVMs = $.map(roles, function (role) {
                            return {
                                role: role,
                                isSelected: ko.observable(false)
                            };
                        });

                        vm.assignmentVMs(assignmentMapVMs);
                    })
                    .fail(function (response) {
                        logger.logError(response.statusText, response, system.getModuleId(vm), true);
                    });

            return true;
        });

        vm.assignmentVMRows = ko.computed(function () {
            var result = [],
                row,
                colLength = parseInt(vm.columnLength(), 10);

            /* Loop through items and push each into a row array that gets
               pushed into the final result.
            */
            for (var i = 0, j = vm.assignmentVMs().length; i < j; i++) {
                if (i % colLength === 0) {
                    if (row) {
                        result.push(row);
                    }
                    row = [];
                }
                row.push(vm.assignmentVMs()[i]);
            }

            // Push the final row.
            if (row) {
                result.push(row);
            }

            return result;
        });

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            if (session.userIsInRole('manage-all')) {
                unitofwork.units.all()
                    .then(function (response) {
                        vm.units(response);
                        vm.selectedDepartmentId(response[0].departments()[0].id());
                    });
            } else {
                var units = unitofwork.manageableUnits.all()
                    .then(function (response) {
                        vm.units(response);
                        vm.selectedDepartmentId(response[0].departments()[0].id());
                    });

                Q.all([units]).fail(self.handleError);
            }

            Q.all([
                units
            ]).fail(self.handleError);

            vm.user(unitofwork.users.create());

            return true;
        }

        function canDeactivate() {
            if (unitofwork.hasChanges()) {
                return confirm('You have unsaved changes. Do you want to discard them?');
            }

            return true;
        }

        function deactivate() {
            if (unitofwork.hasChanges()) {
                unitofwork.rollback();
            }
            vm.assignmentVMs([]);
            vm.selectedDepartmentId(undefined);
            vm.units([]);
            vm.user(undefined);
            return true;
        }

        function saveUser() {
            var self = this;

            applySelectionsToRoleAssignmentMap();

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            unitofwork.commit()
                .then(function (response) {
                    logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                    return router.navigateBack();
                })
                .fail(self.handleError);

            return true;
        }

        function cancelUser() {
            unitofwork.rollback();
            return router.navigateBack();
        }

        function createRoleAssignmentHash(user) {
            var assignmentHash = {};

            $.each(user.roleAssignments(), function (index, map) {
                assignmentHash[map.roleId()] = map;
            });

            return assignmentHash;
        }

        function applySelectionsToRoleAssignmentMap() {
            var user = vm.user(),
                mapVMs = vm.assignmentVMs(),
                assignmentHash = createRoleAssignmentHash(user);

            $.each(mapVMs, function (index, mapVM) {
                var map = assignmentHash[mapVM.role.id()];

                if (mapVM.isSelected()) {
                    // User selected this assignment.
                    if (!map) {
                        // No existing map, so create one.
                        map = unitofwork.roleAssignments.create({
                            roleId: mapVM.role.id(),
                            userId: user.id()
                        });
                    }
                } else {
                    // User unselected this assignment.
                    if (map) {
                        // If map exists, delete it.
                        map.entityAspect.setDeleted();
                    }
                }
            });
        }
    });