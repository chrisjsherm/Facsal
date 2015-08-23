namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Initial : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.AppointmentType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.DepartmentModification",
                c => new
                    {
                        ModificationId = c.Long(nullable: false, identity: true),
                        UpdatedBy = c.String(),
                        UpdatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        Department_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.ModificationId)
                .ForeignKey("dbo.Department", t => t.Department_Id)
                .Index(t => t.Department_Id);
            
            CreateTable(
                "dbo.Department",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(nullable: false, maxLength: 50),
                        SequenceValue = c.String(nullable: false, maxLength: 3),
                        UnitId = c.String(maxLength: 128),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Unit", t => t.UnitId)
                .Index(t => t.UnitId);
            
            CreateTable(
                "dbo.Employment",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        PersonId = c.String(maxLength: 128),
                        DepartmentId = c.String(maxLength: 128),
                        HomeDepartmentId = c.String(maxLength: 128),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                        Department_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Department", t => t.DepartmentId)
                .ForeignKey("dbo.Department", t => t.HomeDepartmentId)
                .ForeignKey("dbo.Person", t => t.PersonId)
                .ForeignKey("dbo.Department", t => t.Department_Id)
                .Index(t => t.PersonId)
                .Index(t => t.DepartmentId)
                .Index(t => t.HomeDepartmentId)
                .Index(t => t.Department_Id);
            
            CreateTable(
                "dbo.Person",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Pid = c.String(nullable: false, maxLength: 30),
                        LastName = c.String(nullable: false, maxLength: 35),
                        FirstName = c.String(nullable: false, maxLength: 35),
                        StatusTypeId = c.Int(nullable: false),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.StatusType", t => t.StatusTypeId, cascadeDelete: true)
                .Index(t => t.StatusTypeId);
            
            CreateTable(
                "dbo.PersonModification",
                c => new
                    {
                        ModificationId = c.Long(nullable: false, identity: true),
                        UpdatedBy = c.String(),
                        UpdatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        Person_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.ModificationId)
                .ForeignKey("dbo.Person", t => t.Person_Id)
                .Index(t => t.Person_Id);
            
            CreateTable(
                "dbo.Salary",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        PersonId = c.String(maxLength: 128),
                        CycleYear = c.Int(nullable: false),
                        Title = c.String(maxLength: 128),
                        FacultyTypeId = c.Int(nullable: false),
                        RankTypeId = c.String(maxLength: 128),
                        AppointmentTypeId = c.Int(nullable: false),
                        LeaveTypeId = c.Int(nullable: false),
                        FullTimeEquivalent = c.Decimal(nullable: false, precision: 18, scale: 2),
                        BannerBaseAmount = c.Int(),
                        BaseAmount = c.Int(nullable: false),
                        AdminAmount = c.Int(nullable: false),
                        EminentAmount = c.Int(nullable: false),
                        PromotionAmount = c.Int(nullable: false),
                        MeritIncrease = c.Int(nullable: false),
                        SpecialIncrease = c.Int(nullable: false),
                        EminentIncrease = c.Int(nullable: false),
                        BaseSalaryAdjustmentNote = c.String(maxLength: 1024),
                        MeritAdjustmentTypeId = c.Int(),
                        MeritAdjustmentNote = c.String(maxLength: 1024),
                        SpecialAdjustmentNote = c.String(maxLength: 1024),
                        Comments = c.String(maxLength: 1024),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.AppointmentType", t => t.AppointmentTypeId, cascadeDelete: true)
                .ForeignKey("dbo.FacultyType", t => t.FacultyTypeId, cascadeDelete: true)
                .ForeignKey("dbo.LeaveType", t => t.LeaveTypeId, cascadeDelete: true)
                .ForeignKey("dbo.MeritAdjustmentType", t => t.MeritAdjustmentTypeId)
                .ForeignKey("dbo.Person", t => t.PersonId)
                .ForeignKey("dbo.RankType", t => t.RankTypeId)
                .Index(t => t.PersonId)
                .Index(t => t.FacultyTypeId)
                .Index(t => t.RankTypeId)
                .Index(t => t.AppointmentTypeId)
                .Index(t => t.LeaveTypeId)
                .Index(t => t.MeritAdjustmentTypeId);
            
            CreateTable(
                "dbo.BaseSalaryAdjustment",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        StartingBaseAmount = c.Int(nullable: false),
                        NewBaseAmount = c.Int(nullable: false),
                        SalaryId = c.Long(nullable: false),
                        BaseAdjustmentTypeId = c.Int(nullable: false),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.BaseAdjustmentType", t => t.BaseAdjustmentTypeId, cascadeDelete: true)
                .ForeignKey("dbo.Salary", t => t.SalaryId, cascadeDelete: true)
                .Index(t => t.SalaryId)
                .Index(t => t.BaseAdjustmentTypeId);
            
            CreateTable(
                "dbo.BaseAdjustmentType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.FacultyType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.LeaveType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.MeritAdjustmentType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 60),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SalaryModification",
                c => new
                    {
                        ModificationId = c.Long(nullable: false, identity: true),
                        UpdatedBy = c.String(),
                        UpdatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        Salary_Id = c.Long(),
                    })
                .PrimaryKey(t => t.ModificationId)
                .ForeignKey("dbo.Salary", t => t.Salary_Id)
                .Index(t => t.Salary_Id);
            
            CreateTable(
                "dbo.RankType",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(nullable: false, maxLength: 35),
                        SequenceValue = c.String(nullable: false, maxLength: 3),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SpecialSalaryAdjustment",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        SalaryId = c.Long(nullable: false),
                        SpecialAdjustmentTypeId = c.Int(nullable: false),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Salary", t => t.SalaryId, cascadeDelete: true)
                .ForeignKey("dbo.SpecialAdjustmentType", t => t.SpecialAdjustmentTypeId, cascadeDelete: true)
                .Index(t => t.SalaryId)
                .Index(t => t.SpecialAdjustmentTypeId);
            
            CreateTable(
                "dbo.SpecialAdjustmentType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.StatusType",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 35),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Unit",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(nullable: false, maxLength: 50),
                        SequenceValue = c.String(nullable: false, maxLength: 3),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.UnitModification",
                c => new
                    {
                        ModificationId = c.Long(nullable: false, identity: true),
                        UpdatedBy = c.String(),
                        UpdatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        Unit_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.ModificationId)
                .ForeignKey("dbo.Unit", t => t.Unit_Id)
                .Index(t => t.Unit_Id);
            
            CreateTable(
                "dbo.RoleAssignment",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        RoleId = c.Int(nullable: false),
                        UserId = c.Int(nullable: false),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Role", t => t.RoleId, cascadeDelete: true)
                .ForeignKey("dbo.User", t => t.UserId, cascadeDelete: true)
                .Index(t => t.RoleId)
                .Index(t => t.UserId);
            
            CreateTable(
                "dbo.Role",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 50),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.Name, unique: true);
            
            CreateTable(
                "dbo.User",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Pid = c.String(nullable: false, maxLength: 30),
                        CreatedBy = c.String(),
                        CreatedDate = c.DateTimeOffset(nullable: false, precision: 7),
                        RowVersion = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.Pid, unique: true);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.RoleAssignment", "UserId", "dbo.User");
            DropForeignKey("dbo.RoleAssignment", "RoleId", "dbo.Role");
            DropForeignKey("dbo.Department", "UnitId", "dbo.Unit");
            DropForeignKey("dbo.UnitModification", "Unit_Id", "dbo.Unit");
            DropForeignKey("dbo.DepartmentModification", "Department_Id", "dbo.Department");
            DropForeignKey("dbo.Employment", "Department_Id", "dbo.Department");
            DropForeignKey("dbo.Employment", "PersonId", "dbo.Person");
            DropForeignKey("dbo.Person", "StatusTypeId", "dbo.StatusType");
            DropForeignKey("dbo.SpecialSalaryAdjustment", "SpecialAdjustmentTypeId", "dbo.SpecialAdjustmentType");
            DropForeignKey("dbo.SpecialSalaryAdjustment", "SalaryId", "dbo.Salary");
            DropForeignKey("dbo.Salary", "RankTypeId", "dbo.RankType");
            DropForeignKey("dbo.Salary", "PersonId", "dbo.Person");
            DropForeignKey("dbo.SalaryModification", "Salary_Id", "dbo.Salary");
            DropForeignKey("dbo.Salary", "MeritAdjustmentTypeId", "dbo.MeritAdjustmentType");
            DropForeignKey("dbo.Salary", "LeaveTypeId", "dbo.LeaveType");
            DropForeignKey("dbo.Salary", "FacultyTypeId", "dbo.FacultyType");
            DropForeignKey("dbo.BaseSalaryAdjustment", "SalaryId", "dbo.Salary");
            DropForeignKey("dbo.BaseSalaryAdjustment", "BaseAdjustmentTypeId", "dbo.BaseAdjustmentType");
            DropForeignKey("dbo.Salary", "AppointmentTypeId", "dbo.AppointmentType");
            DropForeignKey("dbo.PersonModification", "Person_Id", "dbo.Person");
            DropForeignKey("dbo.Employment", "HomeDepartmentId", "dbo.Department");
            DropForeignKey("dbo.Employment", "DepartmentId", "dbo.Department");
            DropIndex("dbo.User", new[] { "Pid" });
            DropIndex("dbo.Role", new[] { "Name" });
            DropIndex("dbo.RoleAssignment", new[] { "UserId" });
            DropIndex("dbo.RoleAssignment", new[] { "RoleId" });
            DropIndex("dbo.UnitModification", new[] { "Unit_Id" });
            DropIndex("dbo.SpecialSalaryAdjustment", new[] { "SpecialAdjustmentTypeId" });
            DropIndex("dbo.SpecialSalaryAdjustment", new[] { "SalaryId" });
            DropIndex("dbo.SalaryModification", new[] { "Salary_Id" });
            DropIndex("dbo.BaseSalaryAdjustment", new[] { "BaseAdjustmentTypeId" });
            DropIndex("dbo.BaseSalaryAdjustment", new[] { "SalaryId" });
            DropIndex("dbo.Salary", new[] { "MeritAdjustmentTypeId" });
            DropIndex("dbo.Salary", new[] { "LeaveTypeId" });
            DropIndex("dbo.Salary", new[] { "AppointmentTypeId" });
            DropIndex("dbo.Salary", new[] { "RankTypeId" });
            DropIndex("dbo.Salary", new[] { "FacultyTypeId" });
            DropIndex("dbo.Salary", new[] { "PersonId" });
            DropIndex("dbo.PersonModification", new[] { "Person_Id" });
            DropIndex("dbo.Person", new[] { "StatusTypeId" });
            DropIndex("dbo.Employment", new[] { "Department_Id" });
            DropIndex("dbo.Employment", new[] { "HomeDepartmentId" });
            DropIndex("dbo.Employment", new[] { "DepartmentId" });
            DropIndex("dbo.Employment", new[] { "PersonId" });
            DropIndex("dbo.Department", new[] { "UnitId" });
            DropIndex("dbo.DepartmentModification", new[] { "Department_Id" });
            DropTable("dbo.User");
            DropTable("dbo.Role");
            DropTable("dbo.RoleAssignment");
            DropTable("dbo.UnitModification");
            DropTable("dbo.Unit");
            DropTable("dbo.StatusType");
            DropTable("dbo.SpecialAdjustmentType");
            DropTable("dbo.SpecialSalaryAdjustment");
            DropTable("dbo.RankType");
            DropTable("dbo.SalaryModification");
            DropTable("dbo.MeritAdjustmentType");
            DropTable("dbo.LeaveType");
            DropTable("dbo.FacultyType");
            DropTable("dbo.BaseAdjustmentType");
            DropTable("dbo.BaseSalaryAdjustment");
            DropTable("dbo.Salary");
            DropTable("dbo.PersonModification");
            DropTable("dbo.Person");
            DropTable("dbo.Employment");
            DropTable("dbo.Department");
            DropTable("dbo.DepartmentModification");
            DropTable("dbo.AppointmentType");
        }
    }
}
