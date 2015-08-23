define(['services/config', 'knockout'],
    function (config, ko) {
        var foreignKeyInvalidValue = 0;

        var self = {
            extendMetadata: extendMetadata
        };

        return self;

        function extendMetadata(metadataStore) {
            extendAppointmentType(metadataStore);
            extendBaseSalaryAdjustment(metadataStore);
            extendDepartment(metadataStore);
            extendEmployment(metadataStore);
            extendFacultyType(metadataStore);
            extendLeaveType(metadataStore);
            extendMeritAdjustmentType(metadataStore);
            extendPerson(metadataStore);
            extendRankType(metadataStore);
            extendRole(metadataStore);
            extendSalary(metadataStore);
            extendSpecialAdjustmentType(metadataStore);
            extendUnit(metadataStore);
            extendUser(metadataStore);
        }

        function extendAppointmentType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('AppointmentType', null, initializer);
        }

        function extendBaseSalaryAdjustment(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);

                entity.formattedCreatedDate = ko.computed(function () {
                    return moment(entity.createdDate()).format('MM/DD/YYYY');
                });

                entity.formattedStartingBaseAmount =
                    ko.observable(entity.startingBaseAmount()).extend({ currency: [0] });

                entity.formattedNewBaseAmount =
                    ko.observable(entity.newBaseAmount()).extend({ currency: [0] });
            };

            metadataStore.registerEntityTypeCtor(
                'BaseSalaryAdjustment', null, initializer);
        }

        function extendDepartment(metadataStore) {
            var departmentCtor = function () {
                this.id = ko.observable(breeze.core.getUuid());
            }

            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('Department', departmentCtor, initializer);
        }

        function extendEmployment(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('Employment', null, initializer);
        }

        function extendFacultyType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('FacultyType', null, initializer);
        }

        function extendLeaveType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('LeaveType', null, initializer);
        }

        function extendMeritAdjustmentType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor(
                'MeritAdjustmentType', null, initializer);
        }

        function extendPerson(metadataStore) {
            var personCtor = function () {
                this.id = ko.observable(breeze.core.getUuid());
            };

            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('Person', personCtor, initializer);
        }

        function extendRankType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('RankType', null, initializer);
        }

        function extendRole(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('Role', null, initializer);
        }

        function extendSalary(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);

                entity.totalAmount = ko.computed(function () {
                    return entity.baseAmount() +
                        entity.adminAmount() +
                        entity.eminentAmount() +
                        entity.promotionAmount();
                });

                entity.newEminentAmount = ko.computed(function () {
                    return entity.eminentAmount() +
                        entity.eminentAmount() / entity.totalAmount() *
                        (entity.meritIncrease() + entity.specialIncrease()) +
                        entity.eminentIncrease();
                });

                entity.newTotalAmount = ko.computed(function () {
                    return entity.baseAmount() +
                        ((1 - entity.eminentAmount() / entity.totalAmount()) *
                        (entity.meritIncrease() + entity.specialIncrease())) +
                        entity.adminAmount() +
                        entity.newEminentAmount() +
                        entity.promotionAmount();
                });

                entity.meritIncrease.subscribe(function (newValue) {
                    if (newValue > 0 && entity.meritAdjustmentTypeId() === 1) {
                        entity.meritAdjustmentTypeId(2);
                    }
                });

                entity.percentIncrease = ko.computed(function () {
                    return (entity.newTotalAmount() / entity.totalAmount() - 1);
                });

                entity.meritPercentIncrease = ko.computed({
                    read: function () {
                        return (entity.meritIncrease() /
                        entity.totalAmount() * 100).formatNumber(2);
                    },
                    write: function (value) {
                        var increase = entity.totalAmount() * (value / 100);
                        entity.formattedMeritIncrease(increase);
                    }
                });

                entity.specialPercentIncrease = ko.computed({
                    read: function () {
                        return (entity.specialIncrease() /
                            entity.totalAmount() * 100).formatNumber(2);
                    },
                    write: function (value) {
                        var increase = entity.totalAmount() * (value / 100);
                        entity.formattedSpecialIncrease(increase);
                    }
                });

                entity.eminentPercentIncrease = ko.computed(function () {
                    return (entity.eminentIncrease() /
                        entity.totalAmount() * 100).formatNumber(2);
                });

                entity.formattedBannerBaseAmount = ko.observable(entity.bannerBaseAmount())
                    .extend({ currency: [0, entity.bannerBaseAmount] });

                entity.formattedBaseAmount = ko.observable(entity.baseAmount())
                    .extend({ currency: [0, entity.baseAmount] });

                entity.formattedTotalAmount =
                    entity.totalAmount.extend({ computedCurrency: [0] });

                entity.formattedAdminAmount = ko.observable(entity.adminAmount())
                    .extend({ currency: [0, entity.adminAmount] });

                entity.formattedEminentAmount = ko.observable(entity.eminentAmount())
                    .extend({ currency: [0, entity.eminentAmount] });

                entity.formattedPromotionAmount = ko.observable(entity.promotionAmount())
                    .extend({ currency: [0, entity.promotionAmount] });

                entity.formattedMeritIncrease = ko.observable(entity.meritIncrease())
                    .extend({ currency: [0, entity.meritIncrease] });

                entity.formattedSpecialIncrease = ko.observable(entity.specialIncrease())
                    .extend({ currency: [0, entity.specialIncrease] });

                entity.formattedEminentIncrease = ko.observable(entity.eminentIncrease())
                    .extend({ currency: [0, entity.eminentIncrease] });

                entity.formattedNewTotalAmount = entity.newTotalAmount
                    .extend({ computedCurrency: [0] });

                entity.formattedPercentIncrease = entity.percentIncrease
                    .extend({ percent: 2 });

                entity.isMeritAdjustmentNoteRequired = ko.computed(function () {
                    var increase = entity.meritIncrease() / entity.totalAmount();
                    var highPercentIncreaseThreshold, lowPercentIncreaseThreshold;

                    switch (entity.facultyTypeId()) {
                        case 1:
                        case 3:
                            highPercentIncreaseThreshold = config.trHighPercentIncreaseThreshold;
                            lowPercentIncreaseThreshold = config.trLowPercentIncreaseThreshold;
                            break;
                        case 2:
                            highPercentIncreaseThreshold = config.highPercentIncreaseThreshold;
                            lowPercentIncreaseThreshold = config.lowPercentIncreaseThreshold;
                            break;
                        default:
                            throw "Invalid faculty type.";
                    }

                    var isOutsideThreshold = increase > highPercentIncreaseThreshold ||
                        increase < lowPercentIncreaseThreshold;

                    var isMeritIncreaseZero = entity.meritIncrease() === 0;

                    var isNotReviewed = entity.meritAdjustmentTypeId() ===
                        config.meritAdjustmentTypeIdIndicatesNotReviewed;

                    if (isOutsideThreshold && isMeritIncreaseZero && isNotReviewed) {
                        return false;
                    }

                    return isOutsideThreshold;
                });

                entity.meritAdjustmentTypeId
                .extend({
                    validation: {
                        validator: function (value) {
                            if (entity.meritIncrease() > 0) {
                                return value > config.meritAdjustmentTypeIdIndicatesNotReviewed;
                            } else {
                                return value > 0;
                            }
                        },
                        message: 'Choose an adjustment reason.'
                    }
                });

                entity.meritAdjustmentNote
                .extend({
                    required: {
                        onlyIf: function () {
                            return entity.isMeritAdjustmentNoteRequired();
                        },
                        message: 'This field is required.'
                    }
                });

                entity.isSpecialAdjustmentNoteRequired = ko.computed(function () {
                    return entity.specialIncrease() !== 0;
                });

                entity.specialAdjustmentNote
                    .extend({
                        required: {
                            onlyIf: function () {
                                return entity.isSpecialAdjustmentNoteRequired();
                            },
                            message: 'This field is required.'
                        }
                    });

                entity.specialSalaryAdjustments
                    .extend({
                        validation: {
                            validator: function (value) {
                                if (entity.isSpecialAdjustmentNoteRequired()) {
                                    return value.length > 0;
                                } else {
                                    return true;
                                }
                            },
                            message: 'Designate a special adjustment reason.'
                        }
                    });
            };

            metadataStore.registerEntityTypeCtor('Salary', null, initializer);
        }

        function extendSpecialAdjustmentType(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor(
                'SpecialAdjustmentType', null, initializer);
        }

        function extendUnit(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);
            };

            metadataStore.registerEntityTypeCtor('Unit', null, initializer);
        }

        function extendUser(metadataStore) {
            var initializer = function (entity) {
                addValidationRules(entity);
                addHasValidationErrorsProperty(entity);

                entity.formattedCreatedDate = ko.computed(function () {
                    return moment(entity.createdDate()).format('MM/DD/YYYY');
                });
            };

            metadataStore.registerEntityTypeCtor('User', null, initializer);
        }

        //#region Internal Methods
        /**
         * Helper function for ensure the type of an entity is the requested
         * param {object} obj - The entity
         * param {string} entityTypeName - The type name
         */
        function ensureEntityType(obj, entityTypeName) {
            if (!obj.entityType || obj.entityType.shortName !== entityTypeName) {
                throw new Error('Object must be an entity of type ' + entityTypeName);
            }
        }

        /**
         * Add Knockout.Validation rules from the entities metadata
         */
        function addValidationRules(entity) {
            var entityType = entity.entityType,
                i,
                property,
                propertyName,
                propertyObject,
                validators,
                u,
                validator,
                nValidator;

            if (entityType) {
                for (i = 0; i < entityType.dataProperties.length; i += 1) {
                    property = entityType.dataProperties[i];
                    propertyName = property.name;
                    propertyObject = entity[propertyName];
                    validators = [];

                    for (u = 0; u < property.validators.length; u += 1) {
                        validator = property.validators[u];
                        nValidator = {
                            propertyName: propertyName,
                            validator: function (val) {
                                var error =
                                    this.innerValidator.validate(val,
                                    { displayName: this.propertyName });
                                this.message = error ? error.errorMessage : "";
                                return error === null;
                            },
                            message: "",
                            innerValidator: validator
                        };
                        validators.push(nValidator);
                    }
                    propertyObject.extend({
                        validation: validators
                    });
                }

                for (i = 0; i < entityType.foreignKeyProperties.length; i += 1) {
                    property = entityType.foreignKeyProperties[i];
                    propertyName = property.name;
                    propertyObject = entity[propertyName];

                    validators = [];
                    for (u = 0; u < property.validators.length; u += 1) {
                        validator = property.validators[u];
                        nValidator = {
                            propertyName: propertyName,
                            validator: function (val) {
                                var error = this.innerValidator.validate(
                                    val, { displayName: this.propertyName });
                                this.message = error ? error.errorMessage : "";
                                return error === null;
                            },
                            message: "",
                            innerValidator: validator
                        };
                        validators.push(nValidator);
                    }
                    propertyObject.extend({
                        validation: validators
                    });
                    if (!property.isNullable) {
                        // Business Rule: 0 is not allowed for required foreign keys.
                        propertyObject.extend({ notEqual: foreignKeyInvalidValue });
                    }
                }
            }
        }

        /**
         * Extend the entity with a has errors property
         * param {object} entity - The entity
         */
        function addHasValidationErrorsProperty(entity) {

            var prop = ko.observable(false);

            var onChange = function () {
                var hasError = entity.entityAspect.getValidationErrors().length > 0;
                if (prop() === hasError) {
                    // collection changed even though entity net error state is unchanged
                    prop.valueHasMutated(); // force notification
                } else {
                    prop(hasError); // change the value and notify
                }
            };

            onChange();             // check now ...
            entity.entityAspect // ... and when errors collection changes
                .validationErrorsChanged.subscribe(onChange);

            // observable property is wired up; now add it to the entity
            entity.hasValidationErrors = prop;
        }
        //#endregion
    });