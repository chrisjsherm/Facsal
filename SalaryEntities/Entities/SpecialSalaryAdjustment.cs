using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class SpecialSalaryAdjustment : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [ForeignKey("Salary")]
        public long SalaryId { get; set; }

        [ForeignKey("SpecialAdjustmentType")]
        public int SpecialAdjustmentTypeId { get; set; }

        public Salary Salary { get; set; }

        public SpecialAdjustmentType SpecialAdjustmentType { get; set; }
    }
}
