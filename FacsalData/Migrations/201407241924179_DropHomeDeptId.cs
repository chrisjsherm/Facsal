namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class DropHomeDeptId : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Employment", "HomeDepartmentId", "dbo.Department");
            DropForeignKey("dbo.Employment", "Department_Id", "dbo.Department");
            DropIndex("dbo.Employment", new[] { "HomeDepartmentId" });
            DropIndex("dbo.Employment", new[] { "Department_Id" });
            DropColumn("dbo.Employment", "Department_Id");
            DropColumn("dbo.Employment", "HomeDepartmentId");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Employment", "HomeDepartmentId", c => c.String(maxLength: 128));
            RenameColumn(table: "dbo.Employment", name: "DepartmentId", newName: "Department_Id");
            AddColumn("dbo.Employment", "DepartmentId", c => c.String(maxLength: 128));
            CreateIndex("dbo.Employment", "Department_Id");
            CreateIndex("dbo.Employment", "HomeDepartmentId");
            AddForeignKey("dbo.Employment", "HomeDepartmentId", "dbo.Department", "Id");
        }
    }
}
