import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import path from 'path'

Font.register({
  family: 'Montserrat',
  fonts: [
    {
      src: path.join(process.cwd(), 'public/fonts/Montserrat-Regular.ttf'),
      fontWeight: 'normal',
    },
    {
      src: path.join(process.cwd(), 'public/fonts/Montserrat-Bold.ttf'),
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#1D5F31',
  },
  borderRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#1D5F31',
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#061629',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#061629',
  },
  content: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#061629',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#1D5F31',
    letterSpacing: 3,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#061629',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D5F31',
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: '80%',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#061629',
    marginBottom: 30,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 8,
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#061629',
    fontWeight: 'bold',
  },
  verificationCode: {
    marginTop: 40,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#061629',
  },
  verificationLabel: {
    fontSize: 8,
    color: '#666666',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  verificationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#061629',
    textAlign: 'center',
    letterSpacing: 2,
  },
  decorativeLine: {
    position: 'absolute',
    left: 40,
    top: '40%',
    bottom: '40%',
    width: 2,
    backgroundColor: '#1D5F31',
  },
})

interface CertificateData {
  studentName: string
  courseTitle: string
  instructorName: string
  issueDate: string
  verificationCode: string
}

interface CertificateTemplateProps {
  certificate: CertificateData
}

export function CertificateTemplate({ certificate }: CertificateTemplateProps) {
  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderLeft} />
        <View style={styles.borderRight} />
        <View style={styles.borderTop} />
        <View style={styles.borderBottom} />
        
        <View style={styles.container}>
          <View style={styles.decorativeLine} />
          
          <View style={styles.content}>
            <Text style={styles.logo}>POWERPLAY</Text>
            <Text style={styles.subtitle}>CERTIFICADO DE CONCLUSÃO</Text>
            
            <Text style={styles.title}>CERTIFICADO</Text>
            <Text style={styles.subtitleText}>
              Certificamos que
            </Text>
            
            <Text style={styles.studentName}>{certificate.studentName}</Text>
            
            <Text style={styles.subtitleText}>
              concluiu com êxito o curso
            </Text>
            
            <Text style={styles.courseName}>{certificate.courseTitle}</Text>
            
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DATA DE EMISSÃO</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>INSTRUTOR</Text>
                <Text style={styles.detailValue}>{certificate.instructorName}</Text>
              </View>
            </View>
            
            <View style={styles.verificationCode}>
              <Text style={styles.verificationLabel}>CÓDIGO DE VERIFICAÇÃO</Text>
              <Text style={styles.verificationValue}>{certificate.verificationCode}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
