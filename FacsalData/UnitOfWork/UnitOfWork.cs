using SalaryEntities.Entities;
using SalaryEntities.Repositories;
using SalaryEntities.Validators;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Breeze.ContextProvider;
using System.Data.Entity.Validation;
using SalaryEntities.UnitOfWork;
using Breeze.ContextProvider.EF6;
using FacsalData.Repositories;

namespace FacsalData.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly EFContextProvider<FacsalDbContext> ContextProvider;
        public IRepository<AppointmentType> AppointmentTypeRepository { get; private set; }
        public IRepository<BaseSalaryAdjustment> BaseSalaryAdjustmentRepository { get; private set; }
        public IRepository<Department> DepartmentRepository { get; private set; }
        public IRepository<Employment> EmploymentRepository { get; private set; }
        public IRepository<FacultyType> FacultyTypeRepository { get; private set; }
        public IRepository<LeaveType> LeaveTypeRepository { get; private set; }
        public IRepository<MeritAdjustmentType> MeritAdjustmentTypeRepository { get; private set; }
        public IRepository<Person> PersonRepository { get; private set; }
        public IRepository<RankType> RankTypeRepository { get; private set; }
        public IRepository<Role> RoleRepository { get; private set; }
        public IRepository<RoleAssignment> RoleAssignmentRepository { get; private set; }
        public IRepository<Salary> SalaryRepository { get; private set; }
        public IRepository<SpecialAdjustmentType> SpecialAdjustmentTypeRepository { get; private set; }
        public IRepository<StatusType> StatusTypeRepository { get; private set; }
        public IRepository<Unit> UnitRepository { get; private set; }
        public IRepository<User> UserRepository { get; private set; }

        public UnitOfWork(IBreezeValidator breezeValidator)
        {
            ContextProvider = new EFContextProvider<FacsalDbContext>();
            ContextProvider.BeforeSaveEntitiesDelegate = breezeValidator.BeforeSaveEntities;
            ContextProvider.BeforeSaveEntityDelegate = breezeValidator.BeforeSaveEntity;

            AppointmentTypeRepository = new Repository<AppointmentType>(ContextProvider.Context);
            BaseSalaryAdjustmentRepository = new Repository<BaseSalaryAdjustment>(ContextProvider.Context);
            DepartmentRepository = new Repository<Department>(ContextProvider.Context);
            EmploymentRepository = new Repository<Employment>(ContextProvider.Context);
            FacultyTypeRepository = new Repository<FacultyType>(ContextProvider.Context);
            LeaveTypeRepository = new Repository<LeaveType>(ContextProvider.Context);
            MeritAdjustmentTypeRepository = new Repository<MeritAdjustmentType>(ContextProvider.Context);
            PersonRepository = new Repository<Person>(ContextProvider.Context);
            RankTypeRepository = new Repository<RankType>(ContextProvider.Context);
            RoleRepository = new Repository<Role>(ContextProvider.Context);
            RoleAssignmentRepository = new Repository<RoleAssignment>(ContextProvider.Context);
            SalaryRepository = new Repository<Salary>(ContextProvider.Context);
            SpecialAdjustmentTypeRepository = new Repository<SpecialAdjustmentType>(ContextProvider.Context);
            StatusTypeRepository = new Repository<StatusType>(ContextProvider.Context);
            UnitRepository = new Repository<Unit>(ContextProvider.Context);
            UserRepository = new Repository<User>(ContextProvider.Context);
        }

        public int Commit()
        {
            try
            {
                return this.ContextProvider.Context.SaveChanges();
            }
            catch (DbEntityValidationException e)
            {
                foreach (var eve in e.EntityValidationErrors)
                {
                    Console.WriteLine("Entity of type \"{0}\" in state \"{1}\" has the following validation errors:",
                        eve.Entry.Entity.GetType().Name, eve.Entry.State);
                    foreach (var ve in eve.ValidationErrors)
                    {
                        Console.WriteLine("- Property: \"{0}\", Error: \"{1}\"",
                            ve.PropertyName, ve.ErrorMessage);
                    }
                }
                throw;
            }
        }

        public string Metadata()
        {
            return this.ContextProvider.Metadata();
        }

        public Breeze.ContextProvider.SaveResult Commit(Newtonsoft.Json.Linq.JObject changeSet)
        {
            try
            {
                return this.ContextProvider.SaveChanges(changeSet);
            }
            catch (DbEntityValidationException e)
            {
                foreach (var eve in e.EntityValidationErrors)
                {
                    Console.WriteLine("Entity of type \"{0}\" in state \"{1}\" has the following validation errors:",
                        eve.Entry.Entity.GetType().Name, eve.Entry.State);
                    foreach (var ve in eve.ValidationErrors)
                    {
                        Console.WriteLine("- Property: \"{0}\", Error: \"{1}\"",
                            ve.PropertyName, ve.ErrorMessage);
                    }
                }
                throw;
            }
        }
    }
}
