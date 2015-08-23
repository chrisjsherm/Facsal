using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class Employment : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Index("IX_PersonAndDepartment", 1, IsUnique = true, IsClustered = false)]
        [ForeignKey("Person")]
        public string PersonId { get; set; }

        [Index("IX_PersonAndDepartment", 2, IsUnique = true, IsClustered = false)]
        [ForeignKey("Department")]
        public string DepartmentId { get; set; }

        public Person Person { get; set; }

        public Department Department { get; set; }
    }
}
