namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RemoveUnitFromRole : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Role", "UnitId", "dbo.Unit");
            DropIndex("dbo.Role", new[] { "UnitId" });
            DropColumn("dbo.Role", "UnitId");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Role", "UnitId", c => c.String(maxLength: 128));
            CreateIndex("dbo.Role", "UnitId");
            AddForeignKey("dbo.Role", "UnitId", "dbo.Unit", "Id");
        }
    }
}
