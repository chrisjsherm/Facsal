define(['global/session', 'services/logger', 'plugins/router',
    'durandal/system', 'services/errorhandler'],
    function (session, logger, router, system, errorhandler) {

        var unitofwork = session.unitofwork(),

            vm = {
                activate: activate,
                attached: attached,
                deactivate: deactivate,

                columnLength: ko.observable(3),
                employments: ko.observableArray(),
                employmentVMs: ko.observableArray(),
                //homeDepartmentId: ko.observable(),
                personId: ko.observable(),
                units: ko.observableArray(),

                cancelChanges: cancelChanges,
                saveChanges: saveChanges,
            };

        errorhandler.includeIn(vm);

        return vm;

        function activate(personId) {
            ga('send', 'pageview',
                { 'page': window.location.href, 'title': document.title });

            vm.personId(personId);

            return true;
        }

        function attached() {
            $('html,body').animate({ scrollTop: 0 }, 0);


            unitofwork.units.all()
                .then(function (response) {
                    vm.units(response);

                    var units = response,

                        p1 = new breeze.Predicate('personId', '==', vm.personId());

                    unitofwork.employments.find(p1)
                        .then(function (response) {

                            vm.employments(response);

                            var employmentHash = createEmploymentHash(response),

                                employmentMapVMs = $.map(units, function (unit) {
                                    var result = [],
                                        row,
                                        colLength = parseInt(vm.columnLength(), 10);

                                    /* Loop through items and push each into a row array that gets
                                       pushed into the final result.
                                    */
                                    for (var i = 0, j = unit.departments().length; i < j; i++) {
                                        if (i % colLength === 0) {
                                            if (row) {
                                                result.push(row);
                                            }
                                            row = [];
                                        }

                                        // Set home department id property on view model. 
                                        //if (!!employmentHash[unit.departments()[i].id()] &&
                                        //    employmentHash[unit.departments()[i].id()].isHomeDepartment()) {

                                        //    vm.homeDepartmentId(employmentHash[unit.departments()[i].id()].departmentId());
                                        //}
                                    
                                        row.push((function () {
                                            var o = {
                                                department: unit.departments()[i],
                                                isSelected: ko.observable(!!employmentHash[unit.departments()[i].id()])
                                            };

                                            //o.isHomeDepartment = ko.computed(function () {
                                            //    if (o.isSelected()) {
                                            //        console.log(o.department.name() + ' is selected.');
                                            //        console.log(o.department.id() === vm.homeDepartmentId());
                                            //        return o.department.id() === vm.homeDepartmentId();
                                            //    }

                                            //    return false;
                                            //});

                                            return o;
                                        })());
                                    }

                                    // Push the final row.
                                    if (row) {
                                        result.push(row);
                                    }

                                    return {
                                        unit: unit,
                                        departmentRows: result
                                    }
                                });

                            vm.employmentVMs(employmentMapVMs);
                        });
                });

            return true;
        }

        function deactivate() {
            vm.employments([]);
            //vm.homeDepartmentId(undefined);
            vm.personId(undefined);
            vm.employmentVMs([]);
            vm.units([]);
        }

        function saveChanges() {
            applySelectionsToEmploymentMap();

            if (!unitofwork.hasChanges()) {
                return logger.log('No changes were detected.', null, system.getModuleId(vm), true);
            }

            console.log('Attempting save.');
            return unitofwork.commit()
                .then(function (response) {
                    return logger.logSuccess('Save successful', response, system.getModuleId(vm), true);
                })
                .fail(function (error) {
                    var rejectedChanges = unitofwork.rollback();
                    vm.handleError(error);
                });
        }

        function cancelChanges() {
            unitofwork.rollback();
            return router.navigateBack();
        }

        function createEmploymentHash(employments) {
            var employmentHash = {};

            $.each(employments, function (index, value) {
                employmentHash[value.departmentId()] = value;
            });

            return employmentHash;
        }

        function applySelectionsToEmploymentMap() {
            var employments = vm.employments(),

                unitMapVMs = vm.employmentVMs(),

                employmentHash = createEmploymentHash(employments);

            $.each(unitMapVMs, function (index, unitMapVM) {
                var mapVMDepartmentRows = unitMapVM.departmentRows;

                $.each(mapVMDepartmentRows, function (index, mapVMRow) {

                    $.each(mapVMRow, function (index, mapVM) {
                        var map = employmentHash[mapVM.department.id()];

                        if (mapVM.isSelected()) {
                            // User has this employment selected.
                            if (!map) {
                                // No existing map, so create one.
                                map = unitofwork.employments.create({
                                    personId: vm.personId(),
                                    departmentId: mapVM.department.id(),
                                    //isHomeDepartment: mapVM.isHomeDepartment()
                                });
                            }
                            //} else {
                            //    if (map.isHomeDepartment() !== mapVM.isHomeDepartment()) {
                            //        // Home department has changed. Update entity.
                            //        map.isHomeDepartment(mapVM.isHomeDepartment());
                            //    }
                            //}
                        } else {
                            // User unselected this adjustment.
                            if (map) {
                                // If map exists, delete it.
                                map.entityAspect.setDeleted();
                            }
                        }
                    });
                });
            });
        }
    });