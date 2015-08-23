define(['plugins/router', 'services/security', 'services/errorhandler',
    'services/entitymanagerprovider', 'model/modelBuilder', 'services/logger',
    'global/session', 'services/config'],
    function (router, appsecurity, errorhandler, entitymanagerprovider, modelBuilder,
        logger, session, config) {

        entitymanagerprovider.modelBuilder = modelBuilder.extendMetadata;

        var viewmodel = {
            activate: activate,
            attached: attached,

            router: router,
            username: ko.observable(),

            logOut: logOut,
        };

        errorhandler.includeIn(viewmodel);

        return viewmodel;

        function activate() {
            var self = this;

            return entitymanagerprovider.prepare()
                .then(init)
                .fail(self.handlevalidationerrors);
        }

        function attached(view) {
            // Initialize Foundation scripts
            $(view).foundation();

            // Create Counter object
            var countdown = new chrisjsherm.Counter({
                seconds: config.logOutCounterSeconds,

                onUpdateStatus: function (second) {
                    // change the UI that displays the seconds remaining in the timeout.
                    if (parseInt(second, 10) < 91) {
                        $('#timeoutModal').foundation('reveal', 'open');
                        $('.counter').text(second);
                    }
                },

                onCounterEnd: function () {
                    window.location.assign(config.logOutUrl);
                },
            });

            // Start counter
            countdown.start();

            // Restart the counter after successful Ajax requests. Close the timeout modal if it's open.
            $(document).ajaxSuccess(function () {
                countdown.restart();
                $('#timeoutModal').foundation('reveal', 'close');
            });

            // Hit the dummy session extension Controller action when the user closes the modal.
            $('.close-reveal-modal').on('click', function () {
                $.get(config.extendSessionUrl);
            });

            // Hook up the 'Continue' button to the default close anchor.
            $('span.button-close-reveal-modal').on('click', function () {
                $('a.close-reveal-modal').trigger('click');
            });
        }

        function logOut() {
            window.location.assign(config.logOutUrl);
        }

        function initializeRouting() {
            //configure routing
            router.makeRelative({ moduleId: 'viewmodels' });

            router.guardRoute = function (routeInfo, params, instance) {
                if (typeof (params.config.requiredRoles) !== "undefined") {
                    var res = session.userIsInRole(params.config.requiredRoles);

                    if (!res) {
                        logger.log("Access denied. Navigation canceled.",
                            null,
                            'viewmodels/shell',
                            true,
                            "warning"
                        );
                    }

                    return res;
                } else {
                    return true;
                }
            };

            return router.map([
                // Nav.
                {
                    route: ['', 'salaries', 'salaries/index'], moduleId: 'salaries/index',
                    title: 'Salaries', nav: true, hash: '#salaries/index'
                },
                {
                    route: 'salaries/search', moduleId: 'salaries/search',
                    title: 'Search', nav: true, hash: '#salaries/search'
                },
                {
                    route: ['reports', 'reports/index'], moduleId: 'reports/index',
                    title: 'Reports', nav: true, hash: '#reports/index'
                },

                // Departments.
                {
                    route: ['departments', 'departments/index'], moduleId: 'departments/index',
                    title: 'Departments', nav: false, hash: '#departments/index',
                    requiredRoles: ['manage-all']
                },
                {
                    route: 'departments/create', moduleId: 'departments/create',
                    title: 'New department', nav: false, hash: '#departments/create',
                    requiredRoles: ['manage-all']
                },

                // Employments.
                {
                    route: 'employments/edit/:personId', moduleId: 'employments/edit',
                    title: 'Edit employments', nav: false, hash: '#employments/edit',
                    requiredRoles: ['manage-all']
                },

                // Persons.
                {
                    route: 'persons/create', moduleId: 'persons/create',
                    title: 'New employee', nav: false, hash: '#persons/create',
                    requiredRoles: ['manage-all']
                },
                {
                    route: 'persons/edit-home-department/:personId', moduleId: 'persons/edit-home-department',
                    title: 'Edit home department', nav: false, hash: '#persons/edit-home-department',
                    requiredRoles: ['manage-all']
                },

                // Reports.
                {
                    route: 'reports/base-salary-adjustment/:unitid(/:departmentid)',
                    moduleId: 'reports/base-salary-adjustment',
                    title: 'Base salary adjustment report', nav: false,
                    hash: '#reports/base-salary-adjustment'
                },
                {
                    route: 'reports/fo-export/:unitid(/:departmentid)',
                    moduleId: 'reports/fo-export',
                    title: 'Fiscal officer export', nav: false, hash: '#reports/fo-export'
                },
                {
                    route: 'reports/merit-summary-report/:unitid(/:departmentid)',
                    moduleId: 'reports/merit-summary-report',
                    title: 'Merit summary report', nav: false,
                    hash: '#reports/merit-summary-report'
                },
                {
                    route: 'reports/meeting/:unitid(/:departmentid)',
                    moduleId: 'reports/meeting',
                    title: 'Meeting report', nav: false, hash: '#reports/meeting'
                },
                {
                    route: 'reports/multiple-employments/:unitid(/:departmentid)',
                    moduleId: 'reports/multiple-employments',
                    title: 'Multiple departments report', nav: false,
                    hash: '#reports/multiple-employments'
                },
                {
                    route: 'reports/role-assignment/:unitid(/:departmentid)',
                    moduleId: 'reports/role-assignment',
                    title: 'User roles report', nav: false,
                    hash: '#reports/role-assignment',
                    requiredRoles: ['manage-all']
                },
                {
                    route: 'reports/salaries-by-faculty-type/:unitid(/:departmentid)',
                    moduleId: 'reports/salaries-by-faculty-type',
                    title: 'Salaries by faculty type report', nav: false,
                    hash: '#reports/salaries-by-faculty-type'
                },
                {
                    route: 'reports/unreviewed/:unitid(/:departmentid)',
                    moduleId: 'reports/unreviewed',
                    title: 'Unreviewed faculty report', nav: false,
                    hash: '#reports/unreviewed'
                },

                // Salaries.
                {
                    route: 'salaries/edit/:salaryid', moduleId: 'salaries/edit',
                    title: 'Edit salary', nav: false, hash: '#salaries/edit/:salaryid'
                },

                // Settings.
                {
                    route: ['settings', 'settings/index'], moduleId: 'settings/index',
                    title: 'Settings', nav: false, hash: '#settings/index',
                    requiredRoles: 'manage-all'
                },

                // Users.
                {
                    route: ['users', 'users/index'], moduleId: 'users/index',
                    title: 'Users', nav: false, hash: '#users/index',
                    requiredRoles: ['manage-users', 'manage-all']
                },
                {
                    route: 'users/edit/:userid', moduleId: 'users/edit',
                    title: 'Edit user', nav: false, hash: '#users/edit/:salaryid',
                    requiredRoles: ['manage-users', 'manage-all']
                },
                {
                    route: 'users/create', moduleId: 'users/create',
                    title: 'New user', nav: false, hash: '#users/create',
                    requiredRoles: ['manage-users', 'manage-all']
                },

                // Route not found.
                { route: 'not-found', moduleId: 'not-found', title: 'Not found', nav: false }
            ])
            .buildNavigationModel()
            .mapUnknownRoutes("not-found", "not-found")
            .activate({ pushState: true });
        }

        function init() {
            return appsecurity.getUserInfo()
                .done(function (data) {
                    if (data.userName) {
                        session.setUser(data);
                        viewmodel.username(data.userName);
                        session.initUnitOfWork();
                        initializeRouting();
                    } else {
                        logger.log("Access denied. Navigation canceled.",
                            null,
                            'viewmodels/shell',
                            true,
                            "warning"
                        );

                        initializeRouting();
                    }
                })
                .fail(function () {
                    logger.log("Access denied. Navigation canceled.",
                        null,
                        'viewmodels/shell',
                        true,
                        "warning"
                    );

                    initializeRouting();
                });
        }
    });