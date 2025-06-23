
export interface TenantDTO {
    id: string;
    name: string;
    address: string;
    dbUrl?: string;
    companyName: string;
    email: string;
    password?: string;
    phone?: string;
    username: string;
  }

  export interface BusinessDTO {
  businessName:string;
  address: AddressDTO;
  companyName: string;
  contacts?: ContactDTO[];
  isActive: boolean;
  instructions?: InstructionDTO[];
  isArchived?: boolean;
}

export interface ContactDTO {
  contactName: string;
  contactPhone?: string;
  contactEmail: string;
  contactRole: string;
}
export interface InstructionDTO {
  instructionType: string;
  instructionDescription: string;
  instructionCreationTimestamp: number;

}

export interface AddressDTO {
  city: string;
  state: string;
  country?: string;
  postalCode: string;
}
