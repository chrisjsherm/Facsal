namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RoleRef : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Role", "UnitId", c => c.String(maxLength: 128));
            AddColumn("dbo.Role", "DepartmentId", c => c.String(maxLength: 128));
            CreateIndex("dbo.Role", "UnitId");
            CreateIndex("dbo.Role", "DepartmentId");
            AddForeignKey("dbo.Role", "DepartmentId", "dbo.Department", "Id");
            AddForeignKey("dbo.Role", "UnitId", "dbo.Unit", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Role", "UnitId", "dbo.Unit");
            DropForeignKey("dbo.Role", "DepartmentId", "dbo.Department");
            DropIndex("dbo.Role", new[] { "DepartmentId" });
            DropIndex("dbo.Role", new[] { "UnitId" });
            DropColumn("dbo.Role", "DepartmentId");
            DropColumn("dbo.Role", "UnitId");
        }
    }
}
