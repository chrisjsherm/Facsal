using SalaryEntities.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Facsal.Models
{
    public class LookupBundle
    {
        public IEnumerable<AppointmentType> AppointmentTypes { get; set; }

        public IEnumerable<Department> Departments { get; set; }
        
        public IEnumerable<FacultyType> FacultyTypes { get; set; }

        public IEnumerable<LeaveType> LeaveTypes { get; set; }

        public IEnumerable<MeritAdjustmentType> MeritAdjustmentTypes { get; set; }

        public IEnumerable<RankType> RankTypes { get; set; }

        public IEnumerable<SpecialAdjustmentType> SpecialAdjustmentTypes { get; set; }

        public IEnumerable<StatusType> StatusTypes { get; set; }

        public IEnumerable<Unit> Units { get; set; }
    }
}