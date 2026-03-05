import prisma from '../db';

export interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | number | null;
}

export interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const reconcileIdentity = async (data: IdentifyRequest): Promise<IdentifyResponse> => {
  // FIX: Force inputs to strict strings or nulls immediately to satisfy Prisma
  const email = data.email ? String(data.email) : null;
  const phoneNumber = data.phoneNumber ? String(data.phoneNumber) : null;

  // If both are missing, we can't do anything
  if (!email && !phoneNumber) {
    throw new Error("Either email or phoneNumber must be provided.");
  }

  // STEP 1: Find any existing contacts that match the email OR phone
  const directMatches = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined }, 
        { phoneNumber: phoneNumber ?? undefined }
      ],
      deletedAt: null 
    }
  });

  // RULE 1: Completely new customer
  if (directMatches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email,
        phoneNumber: phoneNumber,
        linkPrecedence: "primary"
      }
    });

    return {
      contact: {
        primaryContatctId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: []
      }
    };
  }

  // STEP 2: Find the entire cluster of connected contacts
  const primaryIds = new Set<number>();
  directMatches.forEach(contact => {
    if (contact.linkPrecedence === 'primary') {
      primaryIds.add(contact.id);
    } else if (contact.linkedId !== null) {
      primaryIds.add(contact.linkedId);
    }
  });

  let cluster = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(primaryIds) } },
        { linkedId: { in: Array.from(primaryIds) } }
      ],
      deletedAt: null
    },
    orderBy: { createdAt: 'asc' }
  });

  const truePrimary = cluster[0];

  // RULE 3: Merging Accounts
  const secondaryPrimaries = cluster.filter(
    c => c.id !== truePrimary.id && c.linkPrecedence === 'primary'
  );

  if (secondaryPrimaries.length > 0) {
    const idsToDemote = secondaryPrimaries.map(c => c.id);

    await prisma.contact.updateMany({
      where: { id: { in: idsToDemote } },
      data: {
        linkPrecedence: 'secondary',
        linkedId: truePrimary.id,
        updatedAt: new Date()
      }
    });

    await prisma.contact.updateMany({
      where: { linkedId: { in: idsToDemote } },
      data: {
        linkedId: truePrimary.id,
        updatedAt: new Date()
      }
    });

    cluster = await prisma.contact.findMany({
      where: {
        OR: [
          { id: truePrimary.id },
          { linkedId: truePrimary.id }
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // RULE 2: Creating a new secondary contact
  const clusterEmails = new Set(cluster.map(c => c.email).filter(Boolean));
  const clusterPhones = new Set(cluster.map(c => c.phoneNumber).filter(Boolean));

  const isNewEmail = email && !clusterEmails.has(email);
  const isNewPhone = phoneNumber && !clusterPhones.has(phoneNumber);

  if (isNewEmail || isNewPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email: email,
        phoneNumber: phoneNumber,
        linkedId: truePrimary.id,
        linkPrecedence: 'secondary'
      }
    });
    cluster.push(newSecondary);
  }

  // STEP 3: Format Output
  const uniqueEmails = new Set<string>();
  const uniquePhones = new Set<string>();
  const secondaryContactIds: number[] = [];

  if (truePrimary.email) uniqueEmails.add(truePrimary.email);
  if (truePrimary.phoneNumber) uniquePhones.add(truePrimary.phoneNumber);

  cluster.forEach(c => {
    if (c.email) uniqueEmails.add(c.email);
    if (c.phoneNumber) uniquePhones.add(c.phoneNumber);
    if (c.id !== truePrimary.id) {
      secondaryContactIds.push(c.id);
    }
  });

  return {
    contact: {
      primaryContatctId: truePrimary.id,
      emails: Array.from(uniqueEmails),
      phoneNumbers: Array.from(uniquePhones),
      secondaryContactIds
    }
  };
};