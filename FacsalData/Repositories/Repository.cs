using SalaryEntities.Repositories;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ChrisJSherm.Extensions;

namespace FacsalData.Repositories
{
    public class Repository<TEntity> : IRepository<TEntity> where TEntity : class
    {
        protected DbContext Context { get; private set; }

        public Repository(DbContext context)
        {
            this.Context = context;
        }

        public virtual IQueryable<TEntity> All()
        {
            return this.Context.Set<TEntity>();
        }

        public virtual IQueryable<TEntity> Find(System.Linq.Expressions.Expression<Func<TEntity, bool>> predicate)
        {
            return this.Context.Set<TEntity>().Where(predicate);
        }

        public virtual TEntity FirstOrDefault(System.Linq.Expressions.Expression<Func<TEntity, bool>> predicate)
        {
            return this.Context.Set<TEntity>().Where(predicate).FirstOrDefault();
        }

        public virtual TEntity First(System.Linq.Expressions.Expression<Func<TEntity, bool>> predicate)
        {
            return this.Context.Set<TEntity>().Where(predicate).First();
        }

        public virtual TEntity GetById(int id)
        {
            return this.Context.Set<TEntity>().Find(id);
        }

        public virtual TEntity GetById(string id)
        {
            return this.Context.Set<TEntity>().Find(id);
        }


        public virtual TEntity Add(TEntity entity)
        {
            return this.Context.Set<TEntity>().Add(entity);
        }

        public virtual TEntity AddOrUpdate(TEntity entity)
        {
            var tracked = this.Context.Set<TEntity>().Find(this.Context.KeyValuesFor(entity));

            if (tracked != null)
            {
                this.Context.Entry<TEntity>(tracked).CurrentValues.SetValues(entity);
                return tracked;
            }

            this.Context.Set<TEntity>().Add(entity);
            return entity;
        }

        public virtual void Delete(TEntity entity)
        {
            this.Context.Set<TEntity>().Remove(entity);
        }

        public virtual void Attach(TEntity entity)
        {
            this.Context.Set<TEntity>().Attach(entity);
        }
    }
}
