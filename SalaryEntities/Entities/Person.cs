using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.Entities
{
    public class Person : AuditEntityBase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public string Id { get; set; }

        [Required]
        [StringLength(30)]
        [Index(IsUnique = true, IsClustered = false)]
        public string Pid { get; set; }

        [Required]
        [Display(Name = "Last Name")]
        [StringLength(35)]
        public string LastName { get; set; }

        [Required]
        [Display(Name = "First Name")]
        [StringLength(35)]
        public string FirstName { get; set; }

        [ForeignKey("StatusType")]
        public int StatusTypeId { get; set; }

        [Required]
        [ForeignKey("HomeDepartment")]
        public string HomeDepartmentId { get; set; }

        public Department HomeDepartment { get; set; }

        public ICollection<Salary> Salaries { get; set; }

        public ICollection<Employment> Employments { get; set; }

        public ICollection<PersonModification> Modifications { get; set; }

        public StatusType StatusType { get; set; }

        [Display(Name = "Name")]
        public string FullName
        {
            get
            {
                return string.Format("{0} {1}", FirstName, LastName);
            }
        }

        public string Email
        {
            get
            {
                return string.Format("{0}@vt.edu", Pid);
            }
        }
    }
}
