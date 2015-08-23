define([],
    function () {

        //#region Public interface.
        var self = {
            activeStatusTypeId: 1,
            alwaysRefreshMetadata: false,
            currentCycleYear: 2015,
            logOutCounterSeconds: 1170,
            metadataRefreshMeasure: 'weeks',
            metadataRefreshPeriod: 1,
            trHighPercentIncreaseThreshold: 0.06,
            trLowPercentIncreaseThreshold: 0.01,
            highPercentIncreaseThreshold: 0.03,
            lowPercentIncreaseThreshold: 0.01,
            meritAdjustmentTypeIdIndicatesNotReviewed: 1,
            
            // Authentication Routes.
            siteUrl: "/",
            userInfoUrl: "/api/account/getUserInfo",

            remoteServiceName: '/breeze/data',
            // Breeze Routes. Relative to remote service name.
            appointmentTypesUrl: 'appointmentTypes',
            baseSalaryAdjustmentsUrl: 'baseSalaryAdjustments',
            departmentNamesForPerson: '/api/person/getDepartmentNames',
            departmentsUrl: 'departments',
            employmentsUrl: 'employments',
            extendSessionUrl: '/api/session/extend',
            facultyTypesUrl: 'facultyTypes',
            leaveTypesUrl: 'leaveTypes',
            getAssignableRolesUrl: '/api/role/getAssignableRoles',
            logOutUrl: '/cas/logOut',
            lookupsUrl: 'getLookups',
            manageableUnitsUrl: 'getManageableUnits',
            meritAdjustmentTypesUrl: 'meritAdjustmentTypes',
            personsUrl: 'persons',
            personsWithMultipleEmploymentsUrl:
                '/api/report/getPersonsWithMultipleEmployments',
            rankTypesUrl: 'rankTypes',
            rolesUrl: 'getRoles',
            roleAssignmentsUrl: 'roleAssignments',
            salariesUrl: 'salaries',
            salariesByFacultyTypeUrl: '/api/report/getSalariesByFacultyType',
            specialAdjustmentTypesUrl: 'specialAdjustmentTypes',
            specialSalaryAdjustmentsUrl: 'specialSalaryAdjustments',
            statusTypesUrl: 'statusTypes',
            unitsUrl: 'units',
            usersByDepartment: '/api/user/getByDepartmentalAccess',
            usersUrl: 'users',
        };
        //#endregion

        return self;
    });