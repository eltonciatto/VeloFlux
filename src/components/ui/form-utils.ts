import { createContext, useContext } from "react"
import { FieldPath, FieldValues, useFormContext } from "react-hook-form"

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

export const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormItemContextValue = {
  id: string
}

export const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

export const useFormField = () => {
  const fieldContext = useContext(FormFieldContext)
  const itemContext = useContext(FormItemContext)
  const { id } = itemContext

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { name } = fieldContext

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}
