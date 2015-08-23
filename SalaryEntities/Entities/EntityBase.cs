using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public abstract class EntityBase
    {
        [ConcurrencyCheck]
        public int RowVersion { get; internal set; }
    }

    public abstract class AuditEntityBase : EntityBase
    {
        [StringLength(128)]
        public string CreatedBy { get; set; }

        [DataType(DataType.DateTime)]
        public DateTimeOffset CreatedDate { get; set; }
    }

    public abstract class Modification
    {
        [Key]
        public long ModificationId { get; set; }

        public string UpdatedBy {get;set;}

        [DataType(DataType.DateTime)]
        public DateTimeOffset UpdatedDate { get; set; }
    }
}
