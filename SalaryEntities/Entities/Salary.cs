using DataAnnotationsExtensions;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ChrisJSherm.Filters;

namespace SalaryEntities.Entities
{
    [EitherPropertyGreaterThanZero("BaseAmount", "EminentAmount",
        "Either the base amount or eminent amount must be greater than zero.")]
    public class Salary : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Index("IX_PersonAndCycleYear", 1, IsUnique = true, IsClustered = false)]
        [ForeignKey("Person")]
        public string PersonId { get; set; }

        [Index("IX_PersonAndCycleYear", 2, IsUnique = true, IsClustered = false)]
        [Max(2050)]
        [Min(2000)]
        public int CycleYear { get; set; }

        [StringLength(128)]
        public string Title { get; set; }

        [ForeignKey("FacultyType")]
        public int FacultyTypeId { get; set; }

        [ForeignKey("RankType")]
        [Display(Name = "Rank type")]
        public string RankTypeId { get; set; }

        [ForeignKey("AppointmentType")]
        public int AppointmentTypeId { get; set; }

        [ForeignKey("LeaveType")]
        public int LeaveTypeId { get; set; }
        
        [Required]
        [Max(1.00)]
        [Min(0.00)]
        [Display(Name = "FTE")]
        public decimal FullTimeEquivalent { get; set; }

        [Min(0)]
        public int? BannerBaseAmount { get; private set; }

        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Base salary")]
        public int BaseAmount { get; set; }

        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Admin salary")]
        public int AdminAmount { get; set; }

        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Eminent salary")]
        public int EminentAmount { get; set; }

        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Promotion salary")]
        public int PromotionAmount { get; set; }

        [Required]
        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Merit Incr.", ShortName = "Merit")]
        public int MeritIncrease { get; set; }

        [Required]
        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Special Incr.", ShortName = "Special")]
        public int SpecialIncrease { get; set; }

        [Required]
        [Max(100000000)]
        [Min(0)]
        [Display(Name = "Eminent increase", ShortName = "Eminent")]
        public int EminentIncrease { get; set; }

        [StringLength(1024)]
        public string BaseSalaryAdjustmentNote { get; set; }

        [ForeignKey("MeritAdjustmentType")]
        [Display(Name = "Merit adjustment type")]
        public int MeritAdjustmentTypeId { get; set; }

        [StringLength(1024)]
        public string MeritAdjustmentNote { get; set; }

        [StringLength(1024)]
        public string SpecialAdjustmentNote { get; set; }

        [StringLength(1024)]
        public string Comments { get; set; }

        public FacultyType FacultyType { get; set; }

        public RankType RankType { get; set; }

        public AppointmentType AppointmentType { get; set; }

        public MeritAdjustmentType MeritAdjustmentType { get; set; }

        public LeaveType LeaveType { get; set; }

        public Person Person { get; set; }

        public ICollection<BaseSalaryAdjustment> BaseSalaryAdjustments { get; set; }

        public ICollection<SpecialSalaryAdjustment> SpecialSalaryAdjustments { get; set; }

        public ICollection<SalaryModification> Modifications { get; set; }

        [Display(Name = "Starting salary")]
        public int TotalAmount
        {
            get
            {
                return BaseAmount + AdminAmount + EminentAmount + PromotionAmount;
            }
        }

        [Display(Name = "New eminent salary")]
        public int NewEminentAmount
        {
            get
            {
                try
                {
                    return EminentAmount + (EminentAmount / TotalAmount) *
                        (MeritIncrease + SpecialIncrease) + EminentIncrease;
                }
                catch (DivideByZeroException ex)
                {
                    return 0;
                }
            }
        }

        [Display(Name = "New salary")]
        public int NewTotalAmount
        {
            get
            {
                return TotalAmount + MeritIncrease + SpecialIncrease + EminentIncrease;
            }
        }

        [Display(Name = "Total % Incr.")]
        public decimal TotalChange
        {
            get
            {
                try
                {
                    return Math.Round(((decimal.Divide(NewTotalAmount, TotalAmount) - 1) * 100), 2);
                }
                catch (DivideByZeroException ex)
                {
                    return 0;
                }
            }
        }
    }
}
