using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Repositories
{
    public interface IRepository<TEntity> where TEntity : class
    {
        IQueryable<TEntity> All();
        IQueryable<TEntity> Find(Expression<Func<TEntity, bool>> predicate);
        TEntity FirstOrDefault(Expression<Func<TEntity, bool>> predicate);
        TEntity First(Expression<Func<TEntity, bool>> predicate);
        TEntity GetById(int id);
        TEntity GetById(string id);

        TEntity Add(TEntity entity);
        TEntity AddOrUpdate(TEntity entity);
        void Delete(TEntity entity);
        void Attach(TEntity entity);
    }
}
