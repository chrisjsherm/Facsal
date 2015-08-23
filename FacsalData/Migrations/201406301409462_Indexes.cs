namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Indexes : DbMigration
    {
        public override void Up()
        {
            DropIndex("dbo.Salary", new[] { "PersonId" });
            CreateIndex("dbo.Person", "Pid", unique: true);
            CreateIndex("dbo.Salary", new[] { "PersonId", "CycleYear" }, unique: true, name: "IX_PersonAndCycleYear");
        }
        
        public override void Down()
        {
            DropIndex("dbo.Salary", "IX_PersonAndCycleYear");
            DropIndex("dbo.Person", new[] { "Pid" });
            CreateIndex("dbo.Salary", "PersonId");
        }
    }
}
