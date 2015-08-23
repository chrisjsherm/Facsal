/** 
	* @module UnitOfWork containing all repositories
	* @requires app
	* @requires entitymanagerprovider
	* @requires repository 
*/

define(['services/entitymanagerprovider', 'services/repository', 'durandal/app',
    'services/config', 'services/logger'],
	function (entityManagerProvider, repository, app, routeconfig, logger) {

	    var refs = {};

	    /**
		* UnitOfWork ctor
		* @constructor
		*/
	    var UnitOfWork = (function () {

	        var unitofwork = function () {
	            var provider = entityManagerProvider.create();

	            /**
				* Has the current UnitOfWork changed?
				* @method
				* @return {bool}
				*/
	            this.hasChanges = function () {
	                return provider.manager().hasChanges();
	            };

	            /**
				* Commit changeset
				* @method
				* @return {promise}
				*/
	            this.commit = function () {
	                var saveOptions = new breeze.SaveOptions({ resourceName: routeconfig.saveChangesUrl });

	                return provider.manager().saveChanges(null, saveOptions)
						.then(function (saveResult) {
						    app.trigger('saved', saveResult.entities);
						})
	                    .fail(function (error) {
	                        var msg = 'Save failed: ' +
                                breeze.saveErrorMessageService.getErrorMessage(error);
	                        error.message = msg;
	                        logger.logError(msg, null, null, true);
	                        throw error;
	                    });
	            };
                
	            /**
				* Rollback changes
				* @method
				*/
	            this.rollback = function () {
	                return provider.manager().rejectChanges();
	            };

	            // Repositories
	            this.appointmentTypes = repository.create(provider, 'AppointmentType',
                    routeconfig.appointmentTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.baseSalaryAdjustments = repository.create(provider, 'Salary',
                    routeconfig.baseSalaryAdjustmentsUrl);
	            this.departments = repository.create(provider, 'Department',
                    routeconfig.departmentsUrl, breeze.FetchStrategy.FromLocalCache);
	            this.employments = repository.create(provider, 'Employment',
                    routeconfig.employmentsUrl);
	            this.facultyTypes = repository.create(provider, 'FacultyType',
                    routeconfig.facultyTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.leaveTypes = repository.create(provider, 'LeaveType',
                    routeconfig.leaveTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.manageableUnits = repository.create(provider, 'Unit',
                    routeconfig.manageableUnitsUrl);
	            this.meritAdjustmentTypes = repository.create(provider, 'MeritAdjustmentType',
                    routeconfig.meritAdjustmentTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.persons = repository.create(provider, 'Person', routeconfig.personsUrl);
	            this.rankTypes = repository.create(provider, 'RankType',
                    routeconfig.rankTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.roles = repository.create(provider, 'Role', routeconfig.rolesUrl);
	            this.roleAssignments = repository.create(provider, 'RoleAssignment',
                    routeconfig.roleAssignmentsUrl);
	            this.salaries = repository.create(provider, 'Salary',
                    routeconfig.salariesUrl);
	            this.specialAdjustmentTypes = repository.create(provider, 'SpecialAdjustmentType',
                    routeconfig.specialAdjustmentTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.specialSalaryAdjustments = repository.create(provider, 'SpecialSalaryAdjustment',
                    routeconfig.specialSalaryAdjustmentsUrl);
	            this.statusTypes = repository.create(provider, 'StatusType',
                    routeconfig.statusTypesUrl, breeze.FetchStrategy.FromLocalCache);
	            this.units = repository.create(provider, 'Unit', routeconfig.unitsUrl,
                    breeze.FetchStrategy.FromLocalCache);
	            this.users = repository.create(provider, 'User', routeconfig.usersUrl);

	            this.departmentNamesForPerson = function (personId) {
	                return $.ajax({
	                    type: 'GET',
	                    url: routeconfig.departmentNamesForPerson + '/' + personId,
	                    cache: false,
	                    dataType: 'json'
	                });
	            };

	            this.getAssignableRoles = function () {
	                return $.ajax({
	                    type: 'GET',
	                    url: routeconfig.getAssignableRolesUrl,
	                    cache: false,
	                    dataType: 'json'
	                });
	            };

	            this.personsWithMultipleEmployments = function (departmentId) {
	                return $.ajax({
	                    type: 'GET',
	                    url: routeconfig.personsWithMultipleEmploymentsUrl + '/' + departmentId,
	                    cache: false,
	                    dataType: 'json'
	                });
	            };

	            this.salariesByFacultyType = function (departmentId) {
	                return $.ajax({
	                    type: 'GET',
	                    url: routeconfig.salariesByFacultyTypeUrl + '/' + departmentId,
	                    cache: false,
	                    dataType: 'json'
	                });
	            };

	            this.usersByDepartment = function (departmentId) {
	                return $.ajax({
	                    type: 'GET',
	                    url: routeconfig.usersByDepartment + '/' + departmentId,
	                    cache: false,
	                    dataType: 'json'
	                });
	            };
	        };

	        return unitofwork;
	    })();

	    var SmartReference = (function () {

	        var ctor = function () {
	            var value = null;

	            this.referenceCount = 0;

	            this.value = function () {
	                if (value === null) {
	                    value = new UnitOfWork();
	                }

	                this.referenceCount++;
	                return value;
	            };

	            this.clear = function () {
	                value = null;
	                this.referenceCount = 0;

	                clean();
	            };
	        };

	        ctor.prototype.release = function () {
	            this.referenceCount--;
	            if (this.referenceCount === 0) {
	                this.clear();
	            }
	        };

	        return ctor;
	    })();

	    return {
	        create: create,
	        get: get
	    };

	    /**
		 * Get a new UnitOfWork instance
		 * @method
		 * @return {UnitOfWork}
		*/
	    function create() {
	        return new UnitOfWork();
	    }

	    /**
		 * Get a new UnitOfWork based on the provided key
		 * @method
		 * @param {int/string} key - Key used in the reference store
		 * @return {promise}
		*/
	    function get(key) {
	        if (!refs[key]) {
	            refs[key] = new SmartReference();
	        }

	        return refs[key];
	    }

	    /**
		 * Delete references
		 * @method         
		*/
	    function clean() {
	        for (var key in refs) {
	            if (refs[key].referenceCount === 0) {
	                delete refs[key];
	            }
	        }
	    }
	});
