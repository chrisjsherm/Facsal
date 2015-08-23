namespace FacsalData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class HomeDepartment : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Person", "HomeDepartmentId", c => c.String(maxLength: 128));

            // Custom SQL statement to populate HomeDepartmentId.
            Sql("WITH NewEmployment (PersonId, DepartmentId, HomeDepartmentId) " +
                "AS " +
                "( " +
                "SELECT e.PersonId, e.DepartmentId, e.DepartmentId AS HomeDepartmentId " +
                "FROM dbo.Employment e " +
                "WHERE e.IsHomeDepartment = 1 " +
                ") " +
                "UPDATE dbo.Person " +
                "SET dbo.Person.HomeDepartmentId = n.HomeDepartmentId " +
                "FROM NewEmployment n " +
                "JOIN dbo.Person p " +
                "ON p.Id = n.PersonId");

            CreateIndex("dbo.Person", "HomeDepartmentId");
            AddForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Person", "HomeDepartmentId", "dbo.Department");
            DropIndex("dbo.Person", new[] { "HomeDepartmentId" });
            DropColumn("dbo.Person", "HomeDepartmentId");
        }
    }
}
