import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// eslint-disable-next-line react-refresh/only-export-components
const MySwal = withReactContent(Swal);

type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
}

export const showAlert = ({ type, message }: AlertProps) => {
  MySwal.fire({
    toast: true,
    position: "bottom-end",
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: "font-poppins",
    },
  });
};
