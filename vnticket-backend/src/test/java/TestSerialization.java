import com.vnticket.dto.EventDTO;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.Collections;

public class TestSerialization {
    public static void main(String[] args) {
        try {
            EventDTO dto = new EventDTO();
            dto.setId(1L);
            dto.setName("Test");
            PageImpl<EventDTO> page = new PageImpl<>(Collections.singletonList(dto), PageRequest.of(0, 10), 1);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ObjectOutputStream oos = new ObjectOutputStream(baos);
            oos.writeObject(page);
            oos.close();
            System.out.println("Serialization successful: " + baos.toByteArray().length + " bytes");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
