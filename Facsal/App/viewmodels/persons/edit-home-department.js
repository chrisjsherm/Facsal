define(['global/session', 'services/logger', 'plugins/router',
    'durandal/system', 'services/errorhandler'],
    function (session, logger, router, system, errorhandler) {

        var unitofwork = session.unitofwork(),

            vm = {
                activate: activate,
                attached: attached,
                deactivate: deactivate,

                person: ko.observable({ homeDepartmentId: ko.observable('Loading...') }),
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

                    unitofwork.persons.withId(vm.personId())
                        .then(function (response) {
                            vm.person(response.entity);
                        });
                });

            return true;
        }

        function deactivate() {
            vm.personId(undefined);
            vm.person(undefined);
            vm.units([]);
        }

        function saveChanges() {

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
    });