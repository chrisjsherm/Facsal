using ChrisJSherm.Extensions;
using OfficeOpenXml;
using SalaryEntities.Entities;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Drawing;
using System.Globalization;
using System.Linq;
using System.Web;

namespace Facsal.Models.Files
{
    public class MeetingReport : Report
    {
        int NumberOfColumns;
        string UnitName;
        int Row { get; set; }
        bool IsExecutive = false;

        public MeetingReport(ExcelPackage package, IEnumerable<Department> departments,
            IEnumerable<Salary> salaries, int numberOfColumns, bool isExecutive,
            string fileName)
            : base()
        {
            NumberOfColumns = numberOfColumns;
            IsExecutive = isExecutive;
            FileName = fileName;

            GenerateReport(package, departments, salaries);
        }

        private void GenerateReport(ExcelPackage package, IEnumerable<Department> departments, IEnumerable<Salary> salaries)
        {
            UnitName = departments.FirstOrDefault().Unit.Name;

            if (IsExecutive)
            {
                ExcelWorksheet sheet = package.Workbook.Worksheets.Add("Process explanation");
                sheet.Cells[1, 1].Style.WrapText = true;
                sheet.Column(1).Width = 200;
                sheet.Row(1).Height = 300;
            }

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

                #region Department Label
                sheet = WriteDepartmentLabel(sheet, department);
                #endregion

                var teachingSalaries = salaries
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id) &&
                    s.FacultyTypeId == 1);
                sheet = WriteFacultyTypeLabel(sheet, "Teaching / Research");
                var teachingSalariesStartRow = Row + 1;
                sheet = WriteSalaryData(sheet, teachingSalaries);
                var teachingSalariesEndRow = Row;

                var researchSalaries = salaries
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id) &&
                    s.FacultyTypeId == 3);
                sheet = WriteFacultyTypeLabel(sheet, "Research Faculty");
                var researchSalariesStartRow = Row + 1;
                sheet = WriteSalaryData(sheet, researchSalaries);
                var researchSalariesEndRow = Row;

                var adminSalaries = salaries
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id) &&
                    s.FacultyTypeId == 2);
                sheet = WriteFacultyTypeLabel(sheet, "Admin / Professional");
                var adminSalariesStartRow = Row + 1;
                sheet = WriteSalaryData(sheet, adminSalaries);
                var adminSalariesEndRow = Row;

                sheet = WriteTotals(sheet, teachingSalariesStartRow, teachingSalariesEndRow,
                    "Teaching / Research", Color.FromArgb(155, 194, 230), Color.Black);
                sheet = WriteTotals(sheet, researchSalariesStartRow, researchSalariesEndRow,
                    "Research Faculty", Color.FromArgb(155, 194, 230), Color.Black);
                sheet = WriteTotals(sheet, adminSalariesStartRow, adminSalariesEndRow,
                    "Admin / Professional", Color.FromArgb(200, 200, 200), Color.Black);
                sheet = WriteTotals(sheet, teachingSalariesStartRow, researchSalariesEndRow,
                    "Total T/R and Research Faculty", Color.FromArgb(200, 200, 200), Color.Black);
                sheet = WriteTotals(sheet, teachingSalariesStartRow, adminSalariesEndRow,
                    department.Name, Color.FromArgb(0, 140, 186), Color.White);

                sheet = PerformFinalFormatting(sheet);

                Row = 0;
            }

            Package = package;
            FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            if (FileName == null)
            {
                FileName = "FacSal_MeetingReport_" +
                    TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                        System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                    + ".xlsx";
            }
        }

        private ExcelWorksheet WriteTableLabels(ExcelWorksheet sheet)
        {
            int column = 0;

            ExcelRange range_labels = sheet.Cells[Row, 1, Row, NumberOfColumns];
            range_labels.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Bold));
            range_labels.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_labels.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_labels.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(200, 200, 200));
            range_labels.Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Medium;
            range_labels.Style.WrapText = true;

            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.Person.FullName);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.RankType.Name);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.AppointmentType.Name);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.FullTimeEquivalent);
            sheet.Cells[Row, ++column].Value = DataAnnotationsHelper.GetPropertyName<Salary>(s => s.TotalAmount);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.MeritIncrease);
            sheet.Cells[Row, ++column].Value = "Merit Incr. %";
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.SpecialIncrease);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.NewTotalAmount);
            sheet.Cells[Row, ++column].Value =
                DataAnnotationsHelper.GetPropertyName<Salary>(s => s.TotalChange);
            sheet.Cells[Row, ++column].Value =
               DataAnnotationsHelper.GetPropertyName<Salary>(s => s.Comments);

            #region Executive input labels.
            if (IsExecutive)
            {
                sheet.Cells[Row, 12, Row, 15].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(169, 208, 142));

                sheet.Cells[Row, ++column].Value = "MDS Merit Incr.";
                sheet.Cells[Row, ++column].Value = "MDS Merit % Incr.";
                sheet.Cells[Row, ++column].Value = "MDS Special Incr.";
                sheet.Cells[Row, ++column].Value = "MDS Comments";
            }
            #endregion

            return sheet;
        }

        private ExcelWorksheet WriteDepartmentLabel(ExcelWorksheet sheet, Department department)
        {
            #region Department Name
            Row++;
            ExcelRange range_departmentName = sheet.Cells[Row, 1, Row, NumberOfColumns];
            range_departmentName.Merge = true;
            range_departmentName.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Italic));
            range_departmentName.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_departmentName.Value = department.Name;
            range_departmentName.Style.Font.Color.SetColor(Color.White);
            range_departmentName.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_departmentName.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(0, 140, 186));
            #endregion

            return sheet;
        }

        private ExcelWorksheet WriteFacultyTypeLabel(ExcelWorksheet sheet, string facultyType)
        {
            Row++;
            ExcelRange range_facultyType = sheet.Cells[Row, 1, Row, NumberOfColumns];
            range_facultyType.Merge = true;
            range_facultyType.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Italic));
            range_facultyType.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_facultyType.Value = facultyType;
            range_facultyType.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_facultyType.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(155, 194, 230));
            return sheet;
        }

        private ExcelWorksheet WriteSalaryData(ExcelWorksheet sheet, IEnumerable<Salary> salaries)
        {
            int column = 0;

            #region Department salaries
            if (salaries.Count() == 0)
            {
                Row++;
                ExcelRange range_departmentData = sheet.Cells[Row, 1, Row, NumberOfColumns];
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
                    sheet.Cells[Row, ++column].Value = salary.RankType.Name;

                    switch (salary.AppointmentType.Name)
                    {
                        case "Calendar Year":
                            sheet.Cells[Row, ++column].Value = "CY";
                            break;

                        case "Academic Year":
                            sheet.Cells[Row, ++column].Value = "AY";
                            break;

                        case "Research Extended (10)":
                            sheet.Cells[Row, ++column].Value = "RE10";
                            break;

                        case "Research Extended (11)":
                            sheet.Cells[Row, ++column].Value = "RE11";
                            break;

                        case "Research Extended (12)":
                            sheet.Cells[Row, ++column].Value = "RE12";
                            break;
                    }

                    sheet.Cells[Row, ++column].Value = salary.FullTimeEquivalent;
                    sheet.Cells[Row, ++column].Value = salary.TotalAmount;
                    
                    if (IsExecutive)
                    {
                        sheet.Cells[Row, ++column].FormulaR1C1 =
                            "IF(RC[7]>0,RC[-1]*RC[7],RC[6])";
                    }
                    else
                    {
                        sheet.Cells[Row, ++column].Value = salary.MeritIncrease;
                    }

                    sheet.Cells[Row, ++column].FormulaR1C1 = "RC[-1]/RC[-2]";

                    if (IsExecutive)
                    {
                        sheet.Cells[Row, ++column].FormulaR1C1 =
                            "RC[6]";
                    }
                    else
                    {
                        sheet.Cells[Row, ++column].Value =
                            salary.SpecialIncrease;
                    }

                    sheet.Cells[Row, ++column].FormulaR1C1 =
                        "RC[-4]+RC[-3]+RC[-1]";
                    sheet.Cells[Row, ++column].FormulaR1C1 =
                        "RC[-1]/RC[-5]-1";
                    sheet.Cells[Row, ++column].Value = GetComments(salary);

                    #region Executive input.
                    if (IsExecutive)
                    {
                        sheet.Cells[Row, ++column].Value = salary.MeritIncrease;
                        ++column;
                        sheet.Cells[Row, ++column].Value = salary.SpecialIncrease;
                    }
                    #endregion
                }
            }
            #endregion
            return sheet;
        }

        private ExcelWorksheet WriteTotals(ExcelWorksheet sheet, int dataStartRow, int dataEndRow, string label,
            Color backgroundColor, Color fontColor)
        {
            Row++;
            int column = 4;

            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[" + (Row - dataStartRow) * -1 + "]C:R[" + (Row - dataEndRow) * -1 + "]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[" + (Row - dataStartRow) * -1 + "]C:R[" + (Row - dataEndRow) * -1 + "]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[" + (Row - dataStartRow) * -1 + "]C:R[" + (Row - dataEndRow) * -1 + "]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[" + (Row - dataStartRow) * -1 + "]C:R[" + (Row - dataEndRow) * -1 + "]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-5] = 0, 0, RC[-1]/RC[-5]-1)";

            ExcelRange range_department = sheet.Cells[Row, 1, Row, 4];
            range_department.Merge = true;
            range_department.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_department.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_department.Style.Font.Color.SetColor(fontColor);
            range_department.Value = label;
            range_department.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_department.Style.Fill.BackgroundColor.SetColor(backgroundColor);

            ExcelRange range_data = sheet.Cells[Row, 4, Row, NumberOfColumns];
            range_data.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_data.Style.Font.Color.SetColor(fontColor);
            range_data.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_data.Style.Fill.BackgroundColor.SetColor(backgroundColor);

            return sheet;
        }

        private ExcelWorksheet PerformFinalFormatting(ExcelWorksheet sheet)
        {
            //Header
            sheet.HeaderFooter.differentOddEven = false;
            sheet.HeaderFooter.OddHeader.LeftAlignedText = "Virginia Tech Meeting Report: " + UnitName +
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
                sheet.Cells[1, 5, Row, 6];
            ExcelRange range_specialNumberFormatting =
                sheet.Cells[1, 8, Row, 8];
            ExcelRange range_newTotalNumberFormatting =
                sheet.Cells[1, 9, Row, 9];

            ExcelRange range_percentFormatting =
                sheet.Cells[1, 10, Row, 10];
            ExcelRange range_meritPercentFormatting =
                sheet.Cells[1, 7, Row, 7];

            ExcelRange range_comments =
                sheet.Cells[1, 11, Row, 11];
            
            //Cell styling
            range_comments.Style.WrapText = true;
            sheet.Cells[1, 1, Row, 1].Style.WrapText = true;
            sheet.Cells[1, 2, Row, 2].Style.WrapText = true;

            var numberFormat = "_($#,##0_);_($(#,##0);_($\"0\"_);_(@_)";
            range_numberFormatting.Style.Numberformat.Format = numberFormat;
            range_specialNumberFormatting.Style.Numberformat.Format = numberFormat;
            range_newTotalNumberFormatting.Style.Numberformat.Format = numberFormat;

            var percentFormat = "0.00%";
            range_percentFormatting.Style.Numberformat.Format = percentFormat;
            range_meritPercentFormatting.Style.Numberformat.Format = percentFormat;

            sheet.Cells.AutoFitColumns();

            // Widths.
            sheet.Column(1).Width = 19.5;
            sheet.Column(2).Width = 12.5;
            sheet.Column(3).Width = 5.5;
            sheet.Column(4).Width = 3.5;
            sheet.Column(5).Width = 14;
            sheet.Column(6).Width = 9;
            sheet.Column(7).Width = 7.75;
            sheet.Column(8).Width = 9;
            sheet.Column(9).Width = 14;
            sheet.Column(10).Width = 7.75;
            sheet.Column(11).Width = 60;

            // Freeze top row.
            sheet.View.FreezePanes(2, 1);

            if (IsExecutive)
            {
                sheet.Cells[1, 15, Row, 15].Style.WrapText = true;

                sheet.Cells[1, 12, Row, 12].Style.Numberformat.Format = numberFormat;
                sheet.Cells[1, 14, Row, 14].Style.Numberformat.Format = numberFormat;

                sheet.Cells[1, 13, Row, 13].Style.Numberformat.Format = percentFormat;

                sheet.Cells[1, 12, Row, 15].Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                sheet.Cells[1, 12, Row, 15].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(169, 208, 142));

                sheet.Column(11).Width = 40;
                sheet.Column(12).Width = 9;
                sheet.Column(13).Width = 7.75;
                sheet.Column(14).Width = 9;
                sheet.Column(15).Width = 40;

                // Protection from editing data rows.
                sheet.Protection.IsProtected = true;
                sheet.Cells[1, 12, Row, 15].Style.Locked = false;
            }

            return sheet;
        }

        private String GetComments(Salary salary)
        {
            String comment = "";

            if (salary.Title != null &&
                salary.Title.Length > 1)
            {
                comment += "Title: " + salary.Title;
            }

            // If leave is not equal to 'N/A'
            if (salary.LeaveTypeId > 1)
            {
                if (comment.Length > 0)
                {
                    // New line after comments.
                    comment += Environment.NewLine;
                }

                comment += "Leave status: " + salary.LeaveType.Name;
            }

            if (salary.PromotionAmount > 0)
            {
                if (comment.Length > 0)
                {
                    // New line after comments.
                    comment += Environment.NewLine;
                }

                comment += "Promotion: " + salary.PromotionAmount.ToString("C0", CultureInfo.CurrentCulture);
            }

            if (salary.Person.Employments.Count > 1)
            {
                if (comment.Length > 0)
                {
                    // New line after comments.
                    comment += Environment.NewLine;
                }

                comment += "Split-funded:";
                foreach (var department in salary.Person.Employments.Select(e => e.Department))
                {
                    comment += Environment.NewLine;
                    comment += "-" + department.Name;
                }
            }

            if (salary.MeritAdjustmentTypeId > 2)
            {
                if (comment.Length > 0)
                {
                    // New line after comments.
                    comment += Environment.NewLine;
                }

                comment += "Merit Adjustment:";
                comment += Environment.NewLine;
                comment += salary.MeritAdjustmentType.Name;
            }

            if (salary.MeritAdjustmentNote != null &&
                salary.MeritAdjustmentNote.Length > 0)
            {
                if (comment.Length > 0)
                {
                    // New line after merit comments.
                    comment += Environment.NewLine;
                }

                comment += "Merit Adjustment Comment:";
                comment += Environment.NewLine;
                comment += salary.MeritAdjustmentNote;
            }

            if (salary.SpecialIncrease > 0)
            {
                if (comment.Length > 0)
                {
                    // New line after merit comments.
                    comment += Environment.NewLine;
                }

                comment += "Special Adjustment:";
                comment += Environment.NewLine;
                foreach (var adjustment in salary.SpecialSalaryAdjustments)
                {
                    comment += "-" + adjustment.SpecialAdjustmentType.Name;
                    comment += Environment.NewLine;
                }
                comment += "Special Adjustment Comment:";
                comment += Environment.NewLine;
                comment += salary.SpecialAdjustmentNote;
            }

            return comment;
        }
    }
}