namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class PersonDepartmentEmploymentIndex : DbMigration
    {
        public override void Up()
        {
            DropIndex("dbo.Employment", new[] { "PersonId" });
            DropIndex("dbo.Employment", new[] { "DepartmentId" });
            CreateIndex("dbo.Employment", new[] { "PersonId", "DepartmentId" }, unique: true, name: "IX_PersonAndDepartment");
        }
        
        public override void Down()
        {
            DropIndex("dbo.Employment", "IX_PersonAndDepartment");
            CreateIndex("dbo.Employment", "DepartmentId");
            CreateIndex("dbo.Employment", "PersonId");
        }
    }
}
