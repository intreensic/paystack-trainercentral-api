const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const { reference, name, email } = req.body;

  try {
    // 1. Verify Paystack payment
    const verify = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    if (verify.data.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // 2. Register learner on TrainerCentral
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');

    await axios.post(
      `https://trainercentral.com/api/v4/orgs/${process.env.TRAINERCENTRAL_ORG_ID}/learners/invite.json`,
      {
        learner_details: [
          {
            email,
            first_name: firstName,
            last_name: lastName,
            courses: [process.env.TRAINERCENTRAL_COURSE_ID]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TRAINERCENTRAL_OAUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: 'Learner registered successfully' });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: 'Server error' });
  }
}