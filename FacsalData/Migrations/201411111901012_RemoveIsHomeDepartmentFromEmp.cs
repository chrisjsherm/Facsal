namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RemoveIsHomeDepartmentFromEmp : DbMigration
    {
        public override void Up()
        {
            DropColumn("dbo.Employment", "IsHomeDepartment");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Employment", "IsHomeDepartment", c => c.Boolean(nullable: false));
        }
    }
}
