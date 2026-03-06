import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.ResultSetMetaData;

public class TestDbQuery {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/vnticket", "postgres",
                    "123456");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM users LIMIT 1");
            ResultSetMetaData rsmd = rs.getMetaData();
            System.out.println("Columns in users table:");
            for (int i = 1; i <= rsmd.getColumnCount(); i++) {
                System.out.println(rsmd.getColumnName(i) + " (" + rsmd.getColumnTypeName(i) + ")");
            }
            if (rs.next()) {
                System.out.println("\nFirst row data:");
                for (int i = 1; i <= rsmd.getColumnCount(); i++) {
                    System.out.println(rsmd.getColumnName(i) + ": " + rs.getString(i));
                }
            } else {
                System.out.println("\nNo rows in users table.");
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
