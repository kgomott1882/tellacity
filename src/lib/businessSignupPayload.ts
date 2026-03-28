export type BusinessSignupPendingPayload = {
  selectedBusinessId: string | null;
  website: string;
  companyName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  country: string;
  phoneNumber?: string;
  plan?: string;
};
