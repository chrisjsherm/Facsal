using SalaryEntities.Entities;
using SalaryEntities.Validators;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Breeze.ContextProvider;
using FacsalData;
using Breeze.ContextProvider.EF6;
using System.Net;
using ChrisJSherm.Extensions;

namespace Facsal.Validators
{
    public class BreezeValidator : IBreezeValidator
    {
        FacsalDbContext DbContext = new FacsalDbContext();

        public BreezeValidator() { }

        public bool BeforeSaveEntity(Breeze.ContextProvider.EntityInfo entityInfo)
        {
            #region EntityState.Added
            if (entityInfo.EntityState == EntityState.Added)
            {
                if (entityInfo.Entity.GetType().IsSubclassOf(typeof(AuditEntityBase)))
                {
                    SetAuditEntityFields(entityInfo);
                }

                if (entityInfo.Entity.GetType() == typeof(RoleAssignment))
                {
                    if (!IsAuthorizedToCreateRoleAssignment((RoleAssignment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create role assignment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                } 
                else if (entityInfo.Entity.GetType() == typeof(Department))
                {
                    if (!IsAuthorizedToModifyDepartment((Department)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create role assignment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Employment))
                {
                    if (!IsAuthorizedToCreateEmployment((Employment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create employment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Person))
                {
                    if (!IsAuthorizedToCreatePerson((Person)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create person entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }


                }
                else if (entityInfo.Entity.GetType() == typeof(Salary))
                {
                    if (!IsAuthorizedToCreateSalary((Salary)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create salary entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(SpecialSalaryAdjustment))
                {
                    if (!IsAuthorizedToCreateSpecialSalaryAdjustment((SpecialSalaryAdjustment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create special salary adjustment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(User))
                {
                    if (!IsAuthorizedToCreateUser((User)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create user entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else
                {
                    ThrowEntityError("You cannot use this method to create this entity.",
                        "Bad request", HttpStatusCode.BadRequest);
                }
            }
            #endregion

            #region EntityState.Modified
            if (entityInfo.EntityState == EntityState.Modified)
            {
                if (entityInfo.Entity.GetType() == typeof(BaseSalaryAdjustment))
                {
                    if (!IsAuthorizedToUpdateBaseSalaryAdjustment((BaseSalaryAdjustment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify base salary adjustment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Department))
                {
                    if (!IsAuthorizedToModifyDepartment((Department)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create role assignment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Employment))
                {
                    if (!IsAuthorizedToUpdateEmployment((Employment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify base employment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Person))
                {
                    if (!IsAuthorizedToUpdatePerson((Person)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify person entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(RoleAssignment))
                {
                    if (!IsAuthorizedToUpdateRoleAssignment((RoleAssignment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify role assignment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Salary))
                {
                    if (!IsAuthorizedToUpdateSalary((Salary)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify this salary.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(SpecialSalaryAdjustment))
                {
                    if (!IsAuthorizedToUpdateSpecialSalaryAdjustment((SpecialSalaryAdjustment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify this salary.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else
                {
                    ThrowEntityError("You cannot use this method to modify this entity.",
                        "Bad request", HttpStatusCode.BadRequest);
                }
            }
            #endregion

            #region EntityState.Deleted
            if (entityInfo.EntityState == EntityState.Deleted)
            {
                if (entityInfo.Entity.GetType() == typeof(Employment))
                {
                    if (!IsAuthorizedToDeleteEmployment((Employment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to delete this employment.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Department))
                {
                    if (!IsAuthorizedToModifyDepartment((Department)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to create role assignment entities.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(SpecialSalaryAdjustment))
                {
                    if (!IsAuthorizedToDeleteSpecialSalaryAdjustment((SpecialSalaryAdjustment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to modify this salary.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(Role))
                {
                    if (!IsAuthorizedToDeleteRole((Role)entityInfo.Entity))
                    {
                        {
                            ThrowEntityError("You are not authorized to delete this role.",
                                "Unauthorized", HttpStatusCode.Unauthorized);
                        }
                    }
                }
                else if (entityInfo.Entity.GetType() == typeof(RoleAssignment))
                {
                    if (!IsAuthorizedToDeleteRoleAssignment((RoleAssignment)entityInfo.Entity))
                    {
                        ThrowEntityError("You are not authorized to delete this role assignment entity.",
                            "Unauthorized", HttpStatusCode.Unauthorized);
                    }
                }
                else
                {
                    ThrowEntityError("You cannot use this method to delete this entity.",
                        "Bad request", HttpStatusCode.BadRequest);
                }
            }
            #endregion

            return true;
        }

        public Dictionary<Type, List<EntityInfo>> BeforeSaveEntities(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            return saveMap;
        }

        private AuditEntityBase SetAuditEntityFields(Breeze.ContextProvider.EntityInfo entityInfo)
        {
            var entity = (AuditEntityBase)entityInfo.Entity;

            entity.CreatedBy = HttpContext.Current.User.Identity.Name;
            entity.CreatedDate = DateTime.UtcNow;

            return entity;
        }

        #region Create entity authorization methods
        private bool IsAuthorizedToCreateEmployment(Employment employment)
        {
            return IsAuthorizedToModifyEmployment(employment);
        }

        private bool IsAuthorizedToCreatePerson(Person person)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToCreateRoleAssignment(RoleAssignment roleAssignment)
        {
            if (IsAuthorizedToModifyRoleAssignment(roleAssignment))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToCreateSalary(Salary salary)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToCreateSpecialSalaryAdjustment(SpecialSalaryAdjustment adjustment)
        {
            if (IsAuthorizedToModifySpecialSalaryAdjustment(adjustment))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToCreateUser(User user)
        {
            if (HttpContext.Current.User.IsInRole("manage-all") ||
                HttpContext.Current.User.IsInRole("manage-users"))
            {
                return true;
            }

            return false;
        }
        #endregion
        
        #region Update entity authorization methods
        private bool IsAuthorizedToUpdateBaseSalaryAdjustment(BaseSalaryAdjustment adjustment)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToUpdateEmployment(Employment employment)
        {
            return IsAuthorizedToModifyEmployment(employment);
        }

        private bool IsAuthorizedToUpdatePerson(Person person)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToUpdateRoleAssignment(RoleAssignment roleAssignment)
        {
            if (IsAuthorizedToModifyRoleAssignment(roleAssignment))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToUpdateSalary(Salary salary)
        {
            var departments = DbContext.Employments
                .Where(e => e.PersonId == salary.PersonId)
                .Select(e => e.Department);

            foreach (var dept in departments)
            {
                if (HttpContext.Current.User.IsInRole("manage-all") ||
                    HttpContext.Current.User.IsInRole("update-" + dept.Id))
                {
                    return true;
                }
            }

            return false;
        }

        private bool IsAuthorizedToUpdateSpecialSalaryAdjustment(SpecialSalaryAdjustment adjustment)
        {
            if (IsAuthorizedToModifySpecialSalaryAdjustment(adjustment))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToUpdateUser(User user)
        {
            return false;
        }
        #endregion

        #region Delete entity authorization methods
        private bool IsAuthorizedToDeleteEmployment(Employment employment)
        {
            return IsAuthorizedToModifyEmployment(employment);
        }
        
        private bool IsAuthorizedToDeleteSpecialSalaryAdjustment(SpecialSalaryAdjustment adjustment)
        {
            if (IsAuthorizedToModifySpecialSalaryAdjustment(adjustment))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToDeleteRole(Role role)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToDeleteRoleAssignment(RoleAssignment roleAssignment)
        {
            if (IsAuthorizedToModifyRoleAssignment(roleAssignment))
            {
                return true;
            }

            return false;
        }
        #endregion

        #region Authorization method helpers
        private bool IsAuthorizedToModifyDepartment(Department department)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }
        
        private bool IsAuthorizedToModifyEmployment(Employment employment)
        {
            if (HttpContext.Current.User.IsInRole("manage-all"))
            {
                return true;
            }

            return false;
        }

        private bool IsAuthorizedToModifySpecialSalaryAdjustment(SpecialSalaryAdjustment adjustment)
        {
            var salary = DbContext.Salaries
                .FirstOrDefault(s => s.Id == adjustment.SalaryId);

            if (salary != null)
            {
                return IsAuthorizedToUpdateSalary(salary);
            }

            return false;
        }

        private bool IsAuthorizedToModifyRoleAssignment(RoleAssignment roleAssignment)
        {
            var departmentId = DbContext.Roles
                .Find(roleAssignment.RoleId)
                .Name.GetLast(4);

            if (HttpContext.Current.User.IsInRole("manage-all") ||
                HttpContext.Current.User.IsInRole("manage-users-" + departmentId))
            {
                return true;
            }

            return false;
        }
        #endregion

        private void ThrowEntityError(string errorMessage, string errorName, HttpStatusCode statusCode)
        {
            var errors = new List<EntityError>();
            errors.Add(new EntityError()
            {
                EntityTypeName = typeof(Salary).Name,
                ErrorMessage = errorMessage,
                ErrorName = errorName
            });
            var exception = new EntityErrorsException(errors);
            exception.StatusCode = statusCode;
            throw exception;
        }
    }
}