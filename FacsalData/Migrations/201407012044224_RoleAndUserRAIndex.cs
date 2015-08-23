namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RoleAndUserRAIndex : DbMigration
    {
        public override void Up()
        {
            DropIndex("dbo.RoleAssignment", new[] { "RoleId" });
            DropIndex("dbo.RoleAssignment", new[] { "UserId" });
            CreateIndex("dbo.RoleAssignment", new[] { "RoleId", "UserId" }, unique: true, name: "IX_RoleAndUser");
        }
        
        public override void Down()
        {
            DropIndex("dbo.RoleAssignment", "IX_RoleAndUser");
            CreateIndex("dbo.RoleAssignment", "UserId");
            CreateIndex("dbo.RoleAssignment", "RoleId");
        }
    }
}
