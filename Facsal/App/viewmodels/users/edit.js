define(['global/session', 'services/errorhandler',
    'services/logger', 'durandal/system', 'plugins/router'],
    function (session, errorhandler, logger, system,
        router) {

        var unitofwork = session.unitofwork();

        var vm = {
            activate: activate,
            deactivate: deactivate,

            assignmentVMs: ko.observableArray(),
            columnLength: ko.observable(4),
            selectedDepartmentId: ko.observable(),
            roles: ko.observableArray(),
            units: ko.observableArray(),
            user: ko.observable(),

            cancelChanges: cancelChanges,
            saveChanges: saveChanges,
        };

        vm.selectedDepartmentId.subscribe(function (newValue) {
            console.log('Selected department id: ' + newValue);

            if (vm.user()) {
                console.log('New department id: ' + newValue +
                    '. Fetching roles for department.');

                getRoles(newValue)
                    .then(function (response) {
                        vm.roles(response);
                    }).then(function() {
                        return getAssignmentMapVMs(vm.user(),
                            vm.roles());
                    }).then(function (response) {
                        vm.assignmentVMs(response);
                    });
            }

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

        function activate(userId, queryString) {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });

            console.log('Route dept: ' + queryString.departmentid);
            vm.selectedDepartmentId(queryString.departmentid);

            getManageableUnits()
                .then(function (response) {
                    vm.units(response);
                    vm.selectedDepartmentId(response[0].departments()[0].id());
                })

            getUser(userId)
                .then(function (response) {
                    vm.user(response[0]);
                }).then(function () {
                    return getRoles(queryString.departmentid);
                }).then(function (response) {
                    vm.roles(response);
                }).then(function() {
                    return getAssignmentMapVMs(vm.user(),
                        vm.roles());
                }).then(function (response) {
                    vm.assignmentVMs(response);
                });

            return true;
        }

        function deactivate() {
            vm.assignmentVMs([]);
            vm.user(undefined);
            return true;
        }

        function getUser(userId) {
            var predicate = new breeze.Predicate('id', '==', userId),

                expansionCondition = 'roleAssignments';

            return unitofwork.users.find(predicate, expansionCondition)
                .then(function (response) {
                    return response;
                });
        }

        function getManageableUnits() {
            if (session.userIsInRole('manage-all')) {
                return unitofwork.units.all()
                    .then(function (response) {
                        return response;
                    });
            } else {
                return unitofwork.manageableUnits.all()
                    .then(function (response) {
                        return response;
                    });
            }
        }

        function getRoles(departmentId) {
            var p1 = new breeze.Predicate('departmentId', '==', departmentId);

            return unitofwork.roles.find(p1)
                .then(function (response) {
                    return response;
                })
                .fail(function (response) {
                    return logger.logError(response.statusText, response, system.getModuleId(vm), true);
                });
        }

        function getAssignmentMapVMs(user, roles) {
            var assignmentHash = createRoleAssignmentHash(user),

            assignmentMapVMs = $.map(roles, function (role) {
                return {
                    role: role,
                    isSelected: ko.observable(!!assignmentHash[role.id()])
                };
            });

            return assignmentMapVMs;
        }

        function saveChanges() {
            var self = this;

            applySelectionsToRoleAssignmentMap();

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            unitofwork.commit()
                .then(function (response) {
                    return logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                })
                .fail(self.handleError);

            return true;
        }

        function cancelChanges() {
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