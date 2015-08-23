using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChrisJSherm.Filters
{
    public class ConditionalRequireNoteAttribute : ValidationAttribute
    {
        public string ValidationMessage { get; private set; }
        public string NumericPropertyName { get; private set; }
        public int MinimumNoteLength { get; private set; }
        public decimal? FloorValue { get; private set; }
        public decimal? CeilingValue { get; private set; }

        public ConditionalRequireNoteAttribute(string validationMessage,
            string numericPropertyName,
            int minimumNoteLength, decimal? floorValue, decimal? ceilingValue)
        {
            ValidationMessage = validationMessage;
            NumericPropertyName = numericPropertyName;
            MinimumNoteLength = minimumNoteLength;
            FloorValue = 0;
            CeilingValue = 0;

            if (floorValue != null)
            {
                FloorValue = floorValue;
            }

            if (ceilingValue != null)
            {
                CeilingValue = ceilingValue;
            }
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var numericProperty = validationContext.ObjectType.GetProperty(this.NumericPropertyName);
            
            // Check that number property is not null.
            if (numericProperty == null)
            {
                return new ValidationResult(String.Format("Unknown property: {0}.", this.NumericPropertyName));
            }

            // Get the number property value.
            var numericValue = (int)numericProperty.GetValue(validationContext.ObjectInstance, null);

            // Check string property type.
            if (validationContext.ObjectType.GetProperty(validationContext.MemberName).PropertyType != "".GetType())
            {
                return new ValidationResult(String.Format("The type of {0} must be string.",
                    validationContext.DisplayName));
            }

            // Check if the user has entered an adjustment.
            if (numericValue < FloorValue || numericValue > CeilingValue)
            {
                // Check if the user has entered an adjustment explanation.
                if (Convert.ToString(value).Length < this.MinimumNoteLength)
                {
                    return new ValidationResult(
                        String.Format(ValidationMessage));
                }
            }

            // Property is valid.
            return null;
        }
    }
}
