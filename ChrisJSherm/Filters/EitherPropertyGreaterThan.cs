using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChrisJSherm.Filters
{
    public class EitherPropertyGreaterThanZero : ValidationAttribute
    {
        public string FirstPropertyName { get; private set; }
        public string SecondPropertyName { get; private set; }
        public string ValidationMessage { get; private set; }

        public EitherPropertyGreaterThanZero(string firstPropertyName,
            string secondPropertyName, string validationMessage)
        {
            FirstPropertyName = firstPropertyName;
            SecondPropertyName = secondPropertyName;
            ValidationMessage = validationMessage;
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var firstProperty = validationContext.ObjectType.GetProperty(FirstPropertyName);

            // Check that the property is not null.
            if (firstProperty == null)
            {
                return new ValidationResult(String.Format("Unknown property: {0}.", FirstPropertyName));
            }

            var secondProperty = validationContext.ObjectType.GetProperty(SecondPropertyName);

            // Check that the property is not null.
            if (secondProperty == null)
            {
                return new ValidationResult(String.Format("Unknown property: {0}.", SecondPropertyName));
            }

            // Get the values.
            var firstValue = (int)firstProperty.GetValue(validationContext.ObjectInstance, null);
            var secondValue = (int)secondProperty.GetValue(validationContext.ObjectInstance, null);

            // Check if either are greater than zero.
            if (firstValue > 0 || secondValue > 0)
            {
                // Property is valid.
                return null;
            }

            return new ValidationResult(ValidationMessage);
        }
    }
}
