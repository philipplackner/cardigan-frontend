import { useState } from 'react'
import {
  Checkbox,
  ErrorMessage,
  Field,
  IconButton,
  Input,
  Option,
  PasswordRule,
  TextArea,
  icons,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const LONG_TITLE =
  'Single-flight token refresh in the Ktor client so that parallel 401 responses trigger exactly one refresh call and every waiting request retries with the new token'

export function InputsSection() {
  const [checked, setChecked] = useState(true)
  const [options, setOptions] = useState<Record<string, boolean>>({ bug: true })

  return (
    <PreviewSection title="Inputs">
      <PreviewGroup title="Checkbox · unchecked, checked, disabled">
        <Checkbox aria-label="Unchecked" />
        <Checkbox
          aria-label="Checked"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <Checkbox aria-label="Disabled" disabled />
      </PreviewGroup>
      <PreviewGroup title="Input · default, placeholder, error, read-only, disabled, leading and trailing (touch on phones)">
        <div className="flex w-[280px] flex-col gap-12">
          <Input aria-label="Value" defaultValue="Value" />
          <Input aria-label="Placeholder" placeholder="Placeholder" />
          <Input aria-label="Error" defaultValue="Value" isInvalid />
          <Input aria-label="Read-only" defaultValue="Value" readOnly />
          <Input aria-label="Disabled" defaultValue="Value" disabled />
          <Input
            aria-label="Search"
            placeholder="Search cards"
            leadingIcon={icons.SearchIcon}
            trailing={
              <IconButton icon={icons.CloseIcon} label="Clear" size="small" />
            }
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Text area · multi-line, title, description, error; title with a long existing value">
        <div className="flex w-[360px] flex-col gap-12">
          <TextArea aria-label="Multi-line" defaultValue="Text" />
          <TextArea aria-label="Title" type="title" defaultValue="Text" />
          <TextArea
            aria-label="Description"
            type="description"
            placeholder="Add a description"
          />
          <TextArea aria-label="Error" defaultValue="Text" isInvalid />
          <TextArea
            aria-label="Long title"
            type="title"
            defaultValue={LONG_TITLE}
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Field · label, error, hidden label, password rules">
        <div className="flex w-[320px] flex-col gap-16">
          <Field label="Email">
            <Input type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Email" error="Enter a valid email address.">
            <Input type="email" defaultValue="not-an-email" />
          </Field>
          <Field label="Search" isLabelHidden>
            <Input placeholder="Hidden label" leadingIcon={icons.SearchIcon} />
          </Field>
          <Field
            label="Password"
            description={
              <div className="flex flex-col gap-4">
                <PasswordRule text="12+ characters" isMet stateLabel="Met" />
                <PasswordRule
                  text="One number"
                  isMet={false}
                  stateLabel="Not met"
                />
              </div>
            }
          >
            <Input type="password" defaultValue="correct-horse" />
          </Field>
          <Field label="Card title">
            <TextArea type="title" defaultValue="Field with a text area" />
          </Field>
        </div>
      </PreviewGroup>
      <PreviewGroup title="Error message">
        <ErrorMessage>Something is wrong.</ErrorMessage>
      </PreviewGroup>
      <PreviewGroup title="Option · default, checked, disabled (touch on phones, Space toggles)">
        <div className="flex w-[260px] flex-col">
          {['bug', 'feature', 'chore'].map((name) => (
            <Option
              key={name}
              checked={options[name] ?? false}
              onCheckedChange={(value) =>
                setOptions((current) => ({
                  ...current,
                  [name]: value === true,
                }))
              }
            >
              <span className="type-label">{name}</span>
            </Option>
          ))}
          <Option disabled>
            <span className="type-label">disabled</span>
          </Option>
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
