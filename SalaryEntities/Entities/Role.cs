using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class Role : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Index(IsUnique = true, IsClustered = false)]
        [StringLength(50)]
        public string Name { get; set; }

        public ICollection<RoleAssignment> RoleAssignments { get; set; }

        [ForeignKey("Department")]
        public string DepartmentId { get; set; }

        public Department Department { get; set; }
    }
}
