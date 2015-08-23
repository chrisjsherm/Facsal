/** 
	* @module Repositories with all operations allowed
*/

define(function () {

    /**
	 * Repository ctor
	 * @constructor
	*/
    var Repository = (function () {

        var repository = function (entityManagerProvider, entityTypeName, resourceName, fetchStrategy) {

            // Ensure resourceName is registered
            var entityType;
            if (entityTypeName) {
                entityType = getMetastore().getEntityType(entityTypeName);
                entityType.setProperties({ defaultResourceName: resourceName });

                getMetastore().setEntityTypeForResourceName(resourceName, entityTypeName);
            }

            /**
			 * Get Entity by identity
			 * @method
			 * @param {int/string} key - The entity identity
			 * @return {promise}
			*/
            this.withId = function (key) {
                if (!entityTypeName) {
                    throw new Error('Repository must be created with an entity type specified');
                }

                return manager().fetchEntityByKey(entityTypeName, key, true);
            };

            /**
			 * Find Entity by predicate
			 * @method
			 * @param {string} predicate
			 * @param {string} expansionCondition
			 * @return {promise}
			*/
            this.find = function (predicate, expansionCondition) {
                var query;

                if (expansionCondition) {
                    query = breeze.EntityQuery
					    .from(resourceName)
					    .where(predicate)
                        .expand(expansionCondition);
                } else {
                    query = breeze.EntityQuery
                        .from(resourceName)
                        .where(predicate);
                }

                return executeQuery(query);
            };

            /**
			 * Count by predicate
			 * @method
			 * @param {string} predicate
			 * @param {string} expansionCondition
			 * @return {promise}
			*/
            this.count = function (predicate) {
                var query;

                query = breeze.EntityQuery
                    .from(resourceName)
                    .where(predicate)
                    .take(0).inlineCount();

                return entityManagerProvider.manager()
					.executeQuery(query.using(fetchStrategy || breeze.FetchStrategy.FromServer))
					.then(function (data) {
					    return data.inlineCount;
					});
            };

            /**
			 * Find Entity by predicate with projection
			 * @method
			 * @param {string} predicate
			 * @param {string} selectCondition
			 * @return {promise}
			*/
            this.select = function (predicate, selectCondition) {
                var query = breeze.EntityQuery
                    .from(resourceName)
                    .where(predicate)
                    .select(selectCondition);

                return executeQuery(query);
            };

            /**
			 * Find Entity by predicate in cache
			 * @method
			 * @param {string} predicate
			 * @return {object}
			*/
            this.findInCache = function (predicate) {
                var query = breeze.EntityQuery
					.from(resourceName)
					.where(predicate);

                return executeCacheQuery(query);
            };

            /**
			 * Get all entities
			 * @method
			 * @return {promise}
			*/
            this.all = function () {
                var query = breeze.EntityQuery
					.from(resourceName);

                return executeQuery(query);
            };

            /**
			 * Create a new entity and add it to the context
			 * @method
			 * @param {object} values - Initial values
			*/
            this.create = function (values) {
                console.log('Creating entity: ' + entityTypeName);
                var entity = manager().createEntity(entityTypeName, values);
                return entity;
            };

            /**
			 * Set an entity as deleted
			 * @method
			 * @param {object} entity - The entity to delete
			*/
            this.delete = function (entity) {
                ensureEntityType(entity, entityTypeName);
                return entity.entityAspect.setDeleted(entity);
            };

            function executeQuery(query) {
                return entityManagerProvider.manager()
					.executeQuery(query.using(fetchStrategy || breeze.FetchStrategy.FromServer))
					.then(function (data) {
					    return data.results;
					});
            }

            function executeCacheQuery(query) {
                return entityManagerProvider.manager().executeQueryLocally(query);
            }

            function getMetastore() {
                return manager().metadataStore;
            }

            function manager() {
                return entityManagerProvider.manager();
            }

            function ensureEntityType(obj, entityTypeName) {
                if (!obj.entityType || obj.entityType.shortName !== entityTypeName) {
                    throw new Error('Object must be an entity of type ' + entityTypeName);
                }
            }
        };

        return repository;
    })();

    return {
        create: create,
        getCtor: Repository
    };

    /**
	 * Create a new Repository
	 * @method
	 * @param {EntityManagerProvider} entityManagerProvider
	 * @param {string} entityTypeName
	 * @param {string} resourceName
	 * @param {FetchStrategy} fetchStrategy
	 * @return {Repository}
	*/
    function create(entityManagerProvider, entityTypeName, resourceName, fetchStrategy) {
        return new Repository(entityManagerProvider, entityTypeName, resourceName, fetchStrategy);
    }
});