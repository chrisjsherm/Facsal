namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RequireHomeDeptOnPerson : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department");
            DropIndex("dbo.Person", new[] { "HomeDepartmentId" });
            AlterColumn("dbo.Person", "HomeDepartmentId", c => c.String(nullable: false, maxLength: 128));
            CreateIndex("dbo.Person", "HomeDepartmentId");
            AddForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department", "Id", cascadeDelete: true);
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department");
            DropIndex("dbo.Person", new[] { "HomeDepartmentId" });
            AlterColumn("dbo.Person", "HomeDepartmentId", c => c.String(maxLength: 128));
            CreateIndex("dbo.Person", "HomeDepartmentId");
            AddForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department", "Id");
        }
    }
}
