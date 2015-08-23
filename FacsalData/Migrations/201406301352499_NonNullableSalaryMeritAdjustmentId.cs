namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class NonNullableSalaryMeritAdjustmentId : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Salary", "MeritAdjustmentTypeId", "dbo.MeritAdjustmentType");
            DropIndex("dbo.Salary", new[] { "MeritAdjustmentTypeId" });
            AlterColumn("dbo.Salary", "MeritAdjustmentTypeId", c => c.Int(nullable: false));
            CreateIndex("dbo.Salary", "MeritAdjustmentTypeId");
            AddForeignKey("dbo.Salary", "MeritAdjustmentTypeId", "dbo.MeritAdjustmentType", "Id", cascadeDelete: true);
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Salary", "MeritAdjustmentTypeId", "dbo.MeritAdjustmentType");
            DropIndex("dbo.Salary", new[] { "MeritAdjustmentTypeId" });
            AlterColumn("dbo.Salary", "MeritAdjustmentTypeId", c => c.Int());
            CreateIndex("dbo.Salary", "MeritAdjustmentTypeId");
            AddForeignKey("dbo.Salary", "MeritAdjustmentTypeId", "dbo.MeritAdjustmentType", "Id");
        }
    }
}
