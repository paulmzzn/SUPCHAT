// Test de connectivité S3
import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getS3Config } from "../config/secrets.js";

const testS3Connection = async () => {
  console.log("🧪 Test de connectivité S3...");

  try {
    const s3Config = getS3Config();
    console.log("📋 Configuration S3:");
    console.log("   Endpoint:", s3Config.endpoint);
    console.log("   Région:", s3Config.region);
    console.log("   Bucket:", s3Config.bucketName);
    console.log(
      "   Access Key:",
      s3Config.accessKeyId
        ? `${s3Config.accessKeyId.substring(0, 8)}...`
        : "NON DÉFINI"
    );

    const s3Client = new S3Client({
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      forcePathStyle: true,
    });

    // Test 1: Vérifier que le bucket existe
    console.log("🔍 Test 1: Vérification de l'existence du bucket...");
    try {
      await s3Client.send(
        new HeadBucketCommand({ Bucket: s3Config.bucketName })
      );
      console.log("✅ Bucket accessible !");
    } catch (error) {
      console.error("❌ Erreur d'accès au bucket:", error.message);
      if (error.name === "NoSuchBucket") {
        console.log(
          "💡 Le bucket n'existe pas. Buckets possibles: s3-supchat, supchat-s3, etc."
        );
      }
      throw error;
    }

    // Test 2: Lister les objets du bucket
    console.log("📂 Test 2: Listing des objets...");
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: s3Config.bucketName,
        MaxKeys: 5,
      });
      const response = await s3Client.send(listCommand);
      console.log(`✅ ${response.KeyCount || 0} objets trouvés dans le bucket`);
      if (response.Contents && response.Contents.length > 0) {
        console.log("📄 Premiers objets:");
        response.Contents.slice(0, 3).forEach((obj) => {
          console.log(`   - ${obj.Key}`);
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du listing:", error.message);
      throw error;
    }

    console.log("🎉 Tous les tests S3 ont réussi !");
    return true;
  } catch (error) {
    console.error("💥 Échec du test S3:", error);
    console.log("\n🔧 Actions recommandées:");
    console.log("1. Vérifiez vos clés d'accès S3");
    console.log("2. Vérifiez que le bucket existe");
    console.log("3. Vérifiez les permissions du bucket");
    return false;
  }
};

// Exécuter le test si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testS3Connection();
}

export default testS3Connection;
