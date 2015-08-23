using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class RoleAssignment : AuditEntityBase
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Index("IX_RoleAndUser", 1, IsUnique = true, IsClustered = false)]
        [ForeignKey("Role")]
        public int RoleId { get; set; }

        [Index("IX_RoleAndUser", 2, IsUnique = true, IsClustered = false)]
        [ForeignKey("User")]
        public int UserId { get; set; }

        public Role Role { get; set; }

        public User User { get; set; }
    }
}
