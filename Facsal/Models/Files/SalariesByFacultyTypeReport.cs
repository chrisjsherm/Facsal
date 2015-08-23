using ChrisJSherm.Extensions;
using FacsalData;
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
    public class SalariesByFacultyTypeReport : Report
    {
        const int NUM_COLUMNS = 12;
        private string[] labels;
        string UnitName;
        string SheetName;

        int Row { get; set; }

        public SalariesByFacultyTypeReport(ExcelPackage package,
            IEnumerable<Department> departments,
            IQueryable<Salary> salaries, bool singleSheet, string headerText,
            string fileName, string sheetName)
            : base()
        {
            HeaderText = headerText;
            FileName = fileName;
            SheetName = sheetName;

            GenerateReport(package, departments, salaries, singleSheet);
        }

        private void GenerateReport(ExcelPackage package, IEnumerable<Department> departments,
            IQueryable<Salary> salaries, bool singleSheet)
        {
            UnitName = departments.FirstOrDefault().Unit.Name;

            this.labels = new string[NUM_COLUMNS] { "Type", "Pre-promotion salaries", "Promotion",
                "Starting salaries", "Merit increases",
                "Merit increase %", "Merit + Promotion", "Merit + Promotion %",
                "Special increases", "New salaries", "New salaries %", "Merit + Promotion + Special %" };
            if (singleSheet)
            {
                ExcelWorksheet sheet = package.Workbook.Worksheets.Add(SheetName);

                // Default style.
                sheet.Cells.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
                sheet.Cells.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Top;

                #region Table Labels
                Row++;
                sheet = WriteTableLabels(sheet);
                #endregion

                for (var i = 0; i < departments.Count(); i++ )
                {
                    // Insert page break every six departments.
                    if (i > 0 &&
                        i % 13 == 0)
                    {
                        sheet.Row(Row).PageBreak = true;
                    }

                    #region Department Data
                    var department = departments.ElementAt(i);

                    sheet = WriteDepartmentData(sheet, department, salaries
                        .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id)));
                    #endregion
                }

                if (departments.Count() > 1)
                {
                    WriteSummaryData(sheet, departments);
                }

                sheet = PerformFinalFormatting(sheet);
            }
            else
            {
                foreach (var department in departments)
                {
                    // Replace single quote character for valid named range in Excel.
                    ExcelWorksheet sheet = package.Workbook.Worksheets.Add(department.Name.Replace("'", "_"));

                    #region Table Labels
                    Row++;
                    sheet = WriteTableLabels(sheet);
                    #endregion

                    #region Department Data
                    sheet = WriteDepartmentData(sheet, department, salaries
                        .Where(s => s.Person.Employments.Any(e => e.DepartmentId == department.Id)));
                    #endregion

                    if (departments.Count() > 1)
                    {
                        WriteSummaryData(sheet, departments);
                    }

                    sheet = PerformFinalFormatting(sheet);

                    Row = 0;
                }
            }

            Package = package;
            FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            if (FileName == null)
            {
                FileName = "FacSal_SalariesByFacultyTypeReport_" +
                    TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                        System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                    + ".xlsx";
            }
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

            foreach (string label in this.labels)
            {
                sheet.Cells[Row, ++column].Value = label;
            }

            return sheet;
        }

        private ExcelWorksheet WriteDepartmentData(ExcelWorksheet sheet,
            Department department, IEnumerable<Salary> salaries)
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
            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "Teaching / Research";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 1)
                .Sum(s => s.PromotionAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 1)
                .Sum(s => s.TotalAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 1)
                .Sum(s => s.MeritIncrease);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[-2]+RC[-4]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 1)
                .Sum(s => s.SpecialIncrease);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 1)
                .Sum(s => s.NewTotalAmount);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "Research Faculty";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 3)
                .Sum(s => s.PromotionAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 3)
                .Sum(s => s.TotalAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 3)
                .Sum(s => s.MeritIncrease);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[-2]+RC[-4]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 3)
                .Sum(s => s.SpecialIncrease);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 3)
                .Sum(s => s.NewTotalAmount);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            ExcelRange range_subsetData = sheet.Cells[Row, 1, Row + 1, NUM_COLUMNS];
            range_subsetData.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_subsetData.Style.Font.Color.SetColor(Color.Black);
            range_subsetData.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_subsetData.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(200, 200, 200));

            column = 0;
            sheet.Cells[Row, ++column].Value = "Admin / Professional";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 2)
                .Sum(s => s.PromotionAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 2)
                .Sum(s => s.TotalAmount);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 2)
                .Sum(s => s.MeritIncrease);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[-2]+RC[-4]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 2)
                .Sum(s => s.SpecialIncrease);
            sheet.Cells[Row, ++column].Value = salaries
                .Where(s => s.FacultyTypeId == 2)
                .Sum(s => s.NewTotalAmount);
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";
            
            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "T/R and Research";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[-2]+RC[-4]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            ExcelRange range_summaryData = sheet.Cells[Row, 1, Row, NUM_COLUMNS];
            range_summaryData.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_summaryData.Style.Font.Color.SetColor(Color.Black);
            range_summaryData.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_summaryData.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(155, 194, 230));

            column = 0;
            sheet.Cells[Row, ++column].Value = "Department Total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "SUM(R[-4]C,R[-3]C,R[-2]C)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";
            #endregion

            return sheet;
        }

        private ExcelWorksheet WriteSummaryData(ExcelWorksheet sheet,
            IEnumerable<Department> departments)
        {
            int column = 0;
            Row++;

            ExcelRange range_departmentName = sheet.Cells[Row, 1, Row, NUM_COLUMNS];
            range_departmentName.Merge = true;
            range_departmentName.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Italic));
            range_departmentName.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.CenterContinuous;
            range_departmentName.Value = "Unit totals";

            Row++;

            ExcelRange range_totals = sheet.Cells[Row, 1, Row + 1, NUM_COLUMNS];
            range_totals.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_totals.Style.Font.Color.SetColor(Color.Black);
            range_totals.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_totals.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(155, 194, 230));

            ExcelRange range_subSummary = sheet.Cells[Row + 2, 1, Row + 3, NUM_COLUMNS];
            range_subSummary.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_subSummary.Style.Font.Color.SetColor(Color.Black);
            range_subSummary.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_subSummary.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(200, 200, 200));

            ExcelRange range_summaryData = sheet.Cells[Row + 4, 1, Row + 4, NUM_COLUMNS];
            range_summaryData.Style.Font.SetFromFont(new Font("Calibri", 10, FontStyle.Regular));
            range_summaryData.Style.Font.Color.SetColor(Color.White);
            range_summaryData.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range_summaryData.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(0, 140, 186));

            var teachingResearchTotalFunction = "SUM(";
            var teachingResearchTotalRow = -6;

            var researchTotalFunction = "SUM(";
            var researchTotalRow = -6;

            var adminProfessionalTotalFunction = "SUM(";
            var adminProfessionalTotalRow = -6;

            var trResearchTotalFunction = "SUM(";
            var trResearchTotalRow = -6;

            var totalFunction = "SUM(";
            var totalRow = -8;

            for (var i = 1; i < departments.Count(); i++)
            {
                teachingResearchTotalFunction += "R[" + teachingResearchTotalRow + "]C,";
                teachingResearchTotalRow -= 6;

                researchTotalFunction += "R[" + researchTotalRow + "]C,";
                researchTotalRow -= 6;

                adminProfessionalTotalFunction += "R[" + adminProfessionalTotalRow + "]C,";
                adminProfessionalTotalRow -= 6;

                trResearchTotalFunction += "R[" + trResearchTotalRow + "]C,";
                trResearchTotalRow -= 6;

                totalFunction += "R[" + totalRow + "]C:R[" + (totalRow - 2) + "]C,";
                totalRow -= 6;
            }

            teachingResearchTotalFunction += "R[" + teachingResearchTotalRow + "]C)";

            researchTotalFunction += "R[" + researchTotalRow + "]C)";

            adminProfessionalTotalFunction += "R[" + adminProfessionalTotalRow + "]C)";

            trResearchTotalFunction += "R[" + trResearchTotalRow + "]C)";
            
            totalFunction += "R[" + totalRow + "]C:R[" + (totalRow - 2) + "]C)";

            sheet.Cells[Row, ++column].Value = "Teaching / Research total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = teachingResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "Research Faculty total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = researchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "Admin / Professional total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = adminProfessionalTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "T/R and Research total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = trResearchTotalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            Row++;
            column = 0;
            sheet.Cells[Row, ++column].Value = "Total";
            sheet.Cells[Row, ++column].FormulaR1C1 = "RC[2]-RC[1]";
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-2] = 0, 0, RC[-1]/RC[-2])";
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-6] = 0, 0, RC[-1]/RC[-6])";
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = totalFunction;
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-7] = 0, 0, RC[-1]/RC[-7]-1)";
            sheet.Cells[Row, ++column].FormulaR1C1 = "IF(RC[-10] = 0, 0, (RC[-5]+RC[-3])/RC[-10])";

            return sheet;
        }

        private ExcelWorksheet PerformFinalFormatting(ExcelWorksheet sheet)
        {
            //Header
            sheet.HeaderFooter.differentOddEven = false;
            sheet.HeaderFooter.OddHeader.LeftAlignedText = HeaderText;

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

            //Cell styling
            ExcelRange range_firstCurrencyFormatting =
                sheet.Cells[1, 2, Row, 5];
            ExcelRange range_specialIncreaseCurrencyFormatting =
                sheet.Cells[1, 9, Row, 9];
            ExcelRange range_newSalariesCurrencyFormatting =
                sheet.Cells[1, 10, Row, 10];
            var currencyFormatting = "_($#,##0_);_($(#,##0);_($\"0\"_);_(@_)";
            range_firstCurrencyFormatting.Style.Numberformat.Format = currencyFormatting;
            range_specialIncreaseCurrencyFormatting.Style.Numberformat.Format = currencyFormatting;
            range_newSalariesCurrencyFormatting.Style.Numberformat.Format = currencyFormatting;
            sheet.Cells[1, 7, Row, 7].Style.Numberformat.Format = currencyFormatting;

            var percentFormat = "0.00%";
            sheet.Cells[1, 6, Row, 6].Style.Numberformat.Format = percentFormat;
            sheet.Cells[1, 8, Row, 8].Style.Numberformat.Format = percentFormat;
            sheet.Cells[1, 11, Row, 12].Style.Numberformat.Format = percentFormat;

            sheet.Cells.AutoFitColumns();

            return sheet;
        }
    }
}