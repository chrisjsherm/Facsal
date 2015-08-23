using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class Department : AuditEntityBase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public string Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [Required]
        [StringLength(3)]
        public string SequenceValue { get; set; }

        [ForeignKey("Unit")]
        public string UnitId { get; set; }

        public  Unit Unit { get; set; }

        public ICollection<Employment> Employments { get; set; }

        [InverseProperty("HomeDepartment")]
        public ICollection<Person> HomeEmployments { get; set; }

        public ICollection<DepartmentModification> Modifications { get; set; }
    }
}
