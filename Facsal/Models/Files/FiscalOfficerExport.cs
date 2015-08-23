using ChrisJSherm.Extensions;
using OfficeOpenXml;
using SalaryEntities.Entities;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Drawing;
using System.Linq;
using System.Web;

namespace Facsal.Models.Files
{
    public class FiscalOfficerExport : Report
    {
        const int NUM_COLUMNS = 16;
        const int SUMMARY_DATA_COLUMNS = 0;
        int Row { get; set; }
        string UnitName;

        public FiscalOfficerExport(ExcelPackage package, IEnumerable<Department> departments,
            IEnumerable<Salary> salaries, bool singleSheet) : base()
        {
            GenerateReport(package, departments, salaries, singleSheet);
        }

        private void GenerateReport (ExcelPackage package, IEnumerable<Department> departments,
            IEnumerable<Salary> salaries, bool singleSheet)
        {
            UnitName = departments.FirstOrDefault().Unit.Name;

            if (singleSheet)
            {
                ExcelWorksheet sheet = package.Workbook.Worksheets.Add("Unit");

                // Default style.
                sheet.Cells.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
                sheet.Cells.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Top;

                #region Table Labels
                Row++;
                sheet = WriteTableLabels(sheet);
                #endregion

                foreach (var department in departments)
                {
                    #region Department Data
                    sheet = WriteDepartmentData(sheet, department, salaries
                        .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id)));
                    #endregion
                }

                sheet = PerformFinalFormatting(sheet);
            }
            else
            {
                foreach (var department in departments)
                {
                    // Replace single quote character for valid named range in Excel.
                    ExcelWorksheet sheet = package.Workbook.Worksheets.Add(department.Name.Replace("'", "_"));

                    // Default style.
                    sheet.Cells.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
                    sheet.Cells.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Top;

                    #region Table Labels
                    Row++;
                    sheet = WriteTableLabels(sheet);
                    #endregion

                    #region Department Data
                    sheet = WriteDepartmentData(sheet, department, salaries
                        .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id)));
                    #endregion

                    sheet = PerformFinalFormatting(sheet);

                    Row = 0;
                }
            }

            Package = package;
            FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            FileName = "FacSal_FiscalOfficerExport_" +
                TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                + ".xlsx";

        }

        private ExcelWorksheet WriteTableLabels(ExcelWorksheet sheet)
        {
            int column = 0;

            ExcelRange range_labels = sheet.Cells[Row, 1, Row, NUM_COLUMNS];
            range_labels.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Bold));
            range_labels.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_labels.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_labels.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(200, 200, 200));
            range_labels.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Medium;

            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.Person.FullName);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.Person.StatusType.Name);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.RankType.Name);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.AppointmentType.Name);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.FullTimeEquivalent);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.BaseAmount);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.AdminAmount);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.EminentAmount);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.PromotionAmount);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.TotalAmount);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.MeritIncrease);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.SpecialIncrease);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.EminentIncrease);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.NewEminentAmount);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.NewTotalAmount);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.TotalChange);
            
            return sheet;
        }

        private ExcelWorksheet WriteDepartmentData(ExcelWorksheet sheet, Department department,
            IEnumerable<Salary> salaries)
        {
            int column = 0;

            #region Department Name
            Row++;
            ExcelRange range_departmentName = sheet.Cells[Row, 1, Row, NUM_COLUMNS];
            range_departmentName.Merge = true;
            range_departmentName.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Italic));
            range_departmentName.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_departmentName.Value = department.Name;
            #endregion

            #region Department salaries
            if (salaries.Count() == 0)
            {
                Row++;
                ExcelRange range_departmentData = sheet.Cells[Row, 1, Row, NUM_COLUMNS];
                range_departmentData.Merge = true;
                range_departmentData.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
                range_departmentData.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
                range_departmentData.Value = "No records";
            }
            else
            {
                foreach (var salary in salaries)
                {
                    Row++;
                    column = 0;
                    sheet.Cells[Row, ++column].Value = salary.Person.FullName;
                    sheet.Cells[Row, ++column].Value = salary.Person.StatusType.Name;
                    sheet.Cells[Row, ++column].Value = salary.RankType.Name;
                    sheet.Cells[Row, ++column].Value = salary.AppointmentType.Name;
                    sheet.Cells[Row, ++column].Value = salary.FullTimeEquivalent;
                    sheet.Cells[Row, ++column].Value = salary.BaseAmount;
                    sheet.Cells[Row, ++column].Value = salary.AdminAmount;
                    sheet.Cells[Row, ++column].Value = salary.EminentAmount;
                    sheet.Cells[Row, ++column].Value = salary.PromotionAmount;
                    sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(RC[-4]:RC[-1])";
                    sheet.Cells[Row, ++column].Value = salary.MeritIncrease;
                    sheet.Cells[Row, ++column].Value = salary.SpecialIncrease;
                    sheet.Cells[Row, ++column].Value = salary.EminentIncrease;
                    sheet.Cells[Row, ++column].FormulaR1C1 = 
                        "RC[-6]+(RC[-6]/RC[-4])*(RC[-3]+RC[-2])+RC[-1]";
                    sheet.Cells[Row, ++column].FormulaR1C1 =
                        "RC[-9]+RC[-8]+RC[-7]+RC[-6]+RC[-4]+RC[-3]+RC[-2]";
                    sheet.Cells[Row, ++column].FormulaR1C1 =
                        "RC[-1]/RC[-6]-1";
                }
            }
            #endregion

            return sheet;
        }

        private ExcelWorksheet PerformFinalFormatting(ExcelWorksheet sheet)
        {
            //Header
            sheet.HeaderFooter.differentOddEven = false;
            sheet.HeaderFooter.OddHeader.LeftAlignedText = "Fiscal Officer Export: " + UnitName +
                " " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString("MMMM dd, yyyy");

            //Footer
            sheet.HeaderFooter.OddFooter.CenteredText =
                string.Format("Page {0} of {1}",
                    ExcelHeaderFooter.PageNumber, ExcelHeaderFooter.NumberOfPages);

            //Printing
            sheet.PrinterSettings.Orientation = eOrientation.Landscape;
            sheet.PrinterSettings.FitToPage = true;
            sheet.PrinterSettings.FitToWidth = 1;
            sheet.PrinterSettings.FitToHeight = 0;
            sheet.PrinterSettings.TopMargin = 0.75M;
            sheet.PrinterSettings.BottomMargin = 0.75M;
            sheet.PrinterSettings.RightMargin = 0.25M;
            sheet.PrinterSettings.LeftMargin = 0.25M;
            sheet.PrinterSettings.RepeatRows = sheet.Cells["1:1"];

            ExcelRange range_numberFormatting =
                sheet.Cells[1, 5, Row, NUM_COLUMNS - 1];
            ExcelRange range_percentFormatting =
                sheet.Cells[1, NUM_COLUMNS, Row, NUM_COLUMNS];

            //Cell styling
            range_numberFormatting.Style.Numberformat.Format = "_($#,##0_);_($(#,##0);_($\"0\"_);_(@_)";
            range_percentFormatting.Style.Numberformat.Format = "0.00%";

            sheet.Cells.AutoFitColumns();

            return sheet;
        }
    }
}