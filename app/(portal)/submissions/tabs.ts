export type SubmissionTab = {
  key: string
  label: string
  submissionType: 'contact' | 'brochure_download'
  division: string | null
}

export const SUBMISSION_TABS: readonly SubmissionTab[] = [
  { key: 'submissions', label: 'Submissions', submissionType: 'contact', division: null },
  { key: 'newsletter', label: 'Newsletter', submissionType: 'contact', division: 'Newsletter' },
  { key: 'capital', label: 'Capital', submissionType: 'contact', division: 'Capital' },
  { key: 'consulting', label: 'Consulting', submissionType: 'contact', division: 'Consulting' },
  { key: 'real_estate', label: 'Real Estate', submissionType: 'contact', division: 'Real Estate' },
  { key: 'brochure_downloads', label: 'Brochure downloads', submissionType: 'brochure_download', division: null },
] as const

export type SubmissionTabKey = (typeof SUBMISSION_TABS)[number]['key']

export const DEFAULT_SUBMISSION_TAB: SubmissionTabKey = 'submissions'

export function findSubmissionTab(key: string): SubmissionTab | undefined {
  return SUBMISSION_TABS.find((t) => t.key === key)
}
