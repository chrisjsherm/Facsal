define(['services/errorhandler', 'services/logger'],
    function (errorhandler, logger) {

        var vm = {
            activate: activate,
        };

        errorhandler.includeIn(vm);

        return vm;

        function activate() {
            ga('send', 'pageview', { 'page': window.location.href, 'title': document.title });
            return true;
        }
    });