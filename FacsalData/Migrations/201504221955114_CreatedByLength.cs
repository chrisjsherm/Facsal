namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CreatedByLength : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.AppointmentType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Department", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Employment", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Person", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Salary", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.BaseSalaryAdjustment", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.BaseAdjustmentType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.FacultyType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.LeaveType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.MeritAdjustmentType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.RankType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.SpecialSalaryAdjustment", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.SpecialAdjustmentType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.StatusType", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Unit", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.RoleAssignment", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.Role", "CreatedBy", c => c.String(maxLength: 128));
            AlterColumn("dbo.User", "CreatedBy", c => c.String(maxLength: 128));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.User", "CreatedBy", c => c.String());
            AlterColumn("dbo.Role", "CreatedBy", c => c.String());
            AlterColumn("dbo.RoleAssignment", "CreatedBy", c => c.String());
            AlterColumn("dbo.Unit", "CreatedBy", c => c.String());
            AlterColumn("dbo.StatusType", "CreatedBy", c => c.String());
            AlterColumn("dbo.SpecialAdjustmentType", "CreatedBy", c => c.String());
            AlterColumn("dbo.SpecialSalaryAdjustment", "CreatedBy", c => c.String());
            AlterColumn("dbo.RankType", "CreatedBy", c => c.String());
            AlterColumn("dbo.MeritAdjustmentType", "CreatedBy", c => c.String());
            AlterColumn("dbo.LeaveType", "CreatedBy", c => c.String());
            AlterColumn("dbo.FacultyType", "CreatedBy", c => c.String());
            AlterColumn("dbo.BaseAdjustmentType", "CreatedBy", c => c.String());
            AlterColumn("dbo.BaseSalaryAdjustment", "CreatedBy", c => c.String());
            AlterColumn("dbo.Salary", "CreatedBy", c => c.String());
            AlterColumn("dbo.Person", "CreatedBy", c => c.String());
            AlterColumn("dbo.Employment", "CreatedBy", c => c.String());
            AlterColumn("dbo.Department", "CreatedBy", c => c.String());
            AlterColumn("dbo.AppointmentType", "CreatedBy", c => c.String());
        }
    }
}
