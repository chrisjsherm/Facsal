define(['global/session', 'services/errorhandler'],
    function (session, errorhandler) {

        var unitofwork = session.unitofwork();

        var vm = {
            activate: activate,

            instantaneousSearchString: ko.observable(''),
            isSearching: ko.observable(false),
            searchResults: ko.observableArray(),
        };

        errorhandler.includeIn(vm);

        vm.throttledSearchString = ko.computed(vm.instantaneousSearchString)
            .extend({ throttle: 750 });

        vm.throttledSearchString.subscribe(function (newValue) {
            if (!newValue.isNullOrWhiteSpace()) {
                var searchString = newValue.trim().toLowerCase();

                var p1 = breeze.Predicate.create('personId', '==', searchString),
                    p2 = breeze.Predicate.create(
                        'toLower(person.pid)', '==', searchString),
                    p3 = breeze.Predicate.create(
                        'toLower(person.firstName)', breeze.FilterQueryOp.Contains, searchString),
                    p4 = breeze.Predicate.create(
                        'toLower(person.lastName)', breeze.FilterQueryOp.Contains, searchString),
                    predicate = breeze.Predicate.or([p1, p2, p3, p4]),
                    expansionProperty = 'person';

                vm.isSearching(true);

                return unitofwork.salaries.find(predicate, expansionProperty)
                    .then(function (response) {
                        vm.isSearching(false);

                        return vm.searchResults(response);
                    });
            }
        });

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });
            return true;
        }
    });