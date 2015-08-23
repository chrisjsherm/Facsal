using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class BaseSalaryAdjustment : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        public int StartingBaseAmount { get; set; }

        public int NewBaseAmount { get; set; }

        [ForeignKey("Salary")]
        public long SalaryId { get; set; }

        [ForeignKey("BaseAdjustmentType")]
        public int BaseAdjustmentTypeId { get; set; }

        public Salary Salary { get; set; }

        public BaseAdjustmentType BaseAdjustmentType { get; set; }
    }
}
